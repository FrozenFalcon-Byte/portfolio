/* POST /api/ask — grounded question answering over this portfolio.
 *
 * Retrieval, then generation. The question is embedded and ranked
 * against a small corpus of passages from this site; only the top
 * matches are shown to the model, and it is told to answer from them
 * or admit the corpus does not cover the question.
 *
 * The API key never leaves this function.
 */

import { CHUNKS, PROFILE } from './_knowledge.js';
import { SCHEMA } from './_prefs.js';

const HOST = 'https://generativelanguage.googleapis.com/v1beta';
const CHAT_MODEL = 'gemini-2.5-flash';
const EMBED_MODEL = 'text-embedding-004';

const TOP_K = 4;
const MAX_QUESTION = 400;
const MAX_HISTORY = 6;

const RATE_LIMIT = 20;              // requests…
const RATE_WINDOW = 10 * 60 * 1000; // …per ten minutes, per address

const apiKey = () => process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

/* ------------------------------------------------------------------ *
 * Retrieval
 * ------------------------------------------------------------------ */

const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const norm = (a) => Math.sqrt(dot(a, a));
const cosine = (a, b) => {
  const d = norm(a) * norm(b);
  return d === 0 ? 0 : dot(a, b) / d;
};

async function embed(texts, taskType) {
  const res = await fetch(`${HOST}/models/${EMBED_MODEL}:batchEmbedContents?key=${apiKey()}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      requests: texts.map((text) => ({
        model: `models/${EMBED_MODEL}`,
        content: { parts: [{ text }] },
        taskType,
      })),
    }),
  });
  if (!res.ok) throw new Error(`embed failed (${res.status})`);
  const data = await res.json();
  return data.embeddings.map((e) => e.values);
}

/* Embedded once per cold start and held in module scope — the corpus is
   fixed, so paying for it on every question would be waste. */
let indexPromise = null;
const buildIndex = () => {
  if (!indexPromise) {
    indexPromise = embed(
      CHUNKS.map((c) => `${c.title}\n${c.text}`),
      'RETRIEVAL_DOCUMENT'
    ).catch((err) => {
      indexPromise = null; // let the next request try again
      throw err;
    });
  }
  return indexPromise;
};

const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'of', 'and', 'or', 'to', 'in', 'on', 'for', 'with', 'what', 'who', 'how', 'does', 'do', 'did', 'his', 'he', 'they', 'their', 'you', 'your', 'me', 'my', 'at', 'it', 'that', 'this', 'about', 'tell', 'can']);

const words = (s) => s.toLowerCase().match(/[a-z0-9+#.]{2,}/g)?.filter((w) => !STOP.has(w)) ?? [];

/* Used when the embedding call is unavailable. Crude, but a keyword hit
   on the right passage still beats answering from nothing. */
function lexicalRank(question) {
  const q = words(question);
  return CHUNKS.map((c, i) => {
    const hay = `${c.title} ${c.text}`.toLowerCase();
    const score = q.reduce((s, w) => (hay.includes(w) ? s + 1 : s), 0) / (q.length || 1);
    return { i, score };
  });
}

async function retrieve(question) {
  try {
    const [index, [queryVec]] = await Promise.all([
      buildIndex(),
      embed([question], 'RETRIEVAL_QUERY'),
    ]);
    return CHUNKS.map((c, i) => ({ i, score: cosine(queryVec, index[i]) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_K)
      .map(({ i, score }) => ({ ...CHUNKS[i], score }));
  } catch {
    return lexicalRank(question)
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_K)
      .map(({ i, score }) => ({ ...CHUNKS[i], score }));
  }
}

/* ------------------------------------------------------------------ *
 * Generation
 * ------------------------------------------------------------------ */

const systemPrompt = (passages, style) => `You are the assistant on ${PROFILE.name}'s portfolio site. You answer questions from recruiters, engineers and collaborators about his work.

Answer ONLY from the numbered context below. If the context does not contain the answer, say plainly that the site does not cover it and point the reader at ${PROFILE.email}. Never invent employers, dates, metrics, tools or projects.

Rules:
${style.answer === 'detailed'
    ? '- One or two short paragraphs, up to about 150 words, covering what was built, how, and why it matters. No preamble.'
    : '- Two to four sentences. No preamble, no bullet lists unless you are naming more than three items.'}
- Write about him in the third person, as "Ajinkya".
${style.sources === 'hide'
    ? '- Do not include citation numbers; the reader has turned sources off.'
    : '- Cite the passages you used with bracketed numbers, like [1] or [2][3].'}
- His Emerson internship is current and ongoing, and covers two systems: the PMO Command Centre (POR/PPR) and the S&OP Agent. His AIMSS Technical Lead role is a separate college leadership position, not a job at Emerson — never merge them.
- Plain text only. No markdown headings, bold or links.

CONTEXT
${passages.map((p, i) => `[${i + 1}] ${p.title} (${p.section})\n${p.text}`).join('\n\n')}`;

/* ------------------------------------------------------------------ *
 * Rate limiting
 * ------------------------------------------------------------------ */

const hits = new Map();

function overLimit(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.reset) {
    hits.set(ip, { n: 1, reset: now + RATE_WINDOW });
    return false;
  }
  rec.n += 1;
  return rec.n > RATE_LIMIT;
}

// Keep the map from growing without bound on a long-lived instance.
setInterval(() => {
  const now = Date.now();
  for (const [ip, rec] of hits) if (now > rec.reset) hits.delete(ip);
}, RATE_WINDOW).unref?.();

/* ------------------------------------------------------------------ *
 * Handler
 * ------------------------------------------------------------------ */

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > 8000) reject(new Error('body too large'));
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('bad json')); }
    });
    req.on('error', reject);
  });

const sendJSON = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJSON(res, 405, { error: 'Use POST.' });

  if (!apiKey()) {
    return sendJSON(res, 503, {
      error: 'The assistant is not configured on this deployment. Set GEMINI_API_KEY.',
    });
  }

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  if (overLimit(ip)) {
    return sendJSON(res, 429, { error: 'That is a lot of questions. Try again in a few minutes.' });
  }

  let body;
  try {
    body = req.body && typeof req.body === 'object' ? req.body : await readBody(req);
  } catch (err) {
    return sendJSON(res, 400, { error: err.message });
  }

  const question = String(body.question ?? '').trim().slice(0, MAX_QUESTION);
  if (!question) return sendJSON(res, 400, { error: 'Ask something first.' });

  const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY) : [];

  // Reader settings from /settings, checked against the same schema the
  // settings page is built from. Anything unknown falls back quietly.
  const pick = (k) => (SCHEMA[k].values.includes(body.style?.[k]) ? body.style[k] : SCHEMA[k].def);
  const style = { answer: pick('answer'), sources: pick('sources') };

  let passages;
  try {
    passages = await retrieve(question);
  } catch {
    return sendJSON(res, 502, { error: 'Retrieval is down right now.' });
  }

  const contents = [
    ...history
      .filter((m) => m && typeof m.content === 'string')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(m.content).slice(0, 1200) }],
      })),
    { role: 'user', parts: [{ text: question }] },
  ];

  let upstream;
  try {
    upstream = await fetch(
      `${HOST}/models/${CHAT_MODEL}:streamGenerateContent?alt=sse&key=${apiKey()}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt(passages, style) }] },
          contents,
          generationConfig: {
            temperature: 0.25,
            maxOutputTokens: style.answer === 'detailed' ? 700 : 400,
            // No visible thinking on a two-sentence answer — it is pure latency.
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );
  } catch {
    return sendJSON(res, 502, { error: 'Could not reach the model.' });
  }

  if (!upstream.ok || !upstream.body) {
    return sendJSON(res, 502, { error: `The model refused the request (${upstream.status}).` });
  }

  res.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
  });

  const send = (payload) => res.write(`data: ${JSON.stringify(payload)}\n\n`);

  send({
    type: 'sources',
    // The score ships too: the retrieval panel draws it, which is the
    // only honest way to show the reader how strong a match actually was.
    sources: passages.map((p, i) => ({
      n: i + 1, title: p.title, section: p.section,
      score: Math.round((p.score ?? 0) * 100) / 100,
    })),
  });

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let wrote = false;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const raw = line.slice(5).trim();
        if (!raw || raw === '[DONE]') continue;
        try {
          const json = JSON.parse(raw);
          const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
          if (text) { wrote = true; send({ type: 'delta', text }); }
        } catch { /* a partial frame; the next read completes it */ }
      }
    }
  } catch {
    send({ type: 'error', error: 'The answer was cut short.' });
  }

  if (!wrote) send({ type: 'error', error: 'The model returned nothing. Try rephrasing.' });
  send({ type: 'done' });
  res.end();
}
