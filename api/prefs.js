/* /api/prefs — settings that travel.
 *
 *   POST { prefs }    validates every field against the shared schema,
 *                     packs the setup into a few bytes, signs it and
 *                     returns a short code like 2B4K-9QXM-T7.
 *   GET  ?code=…      checks the signature, unpacks and returns the
 *                     settings, re-validated on the way out.
 *
 * Nothing is stored. The code is the data: a version byte, a bit field
 * of choices, the cursor name, and four bytes of HMAC-SHA256 so a typo
 * or a code that was not issued here is refused rather than applied
 * half-right. No database, no accounts, and nothing to leak.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { validate, pack, unpack, toBase32, fromBase32, group } from './_prefs.js';

const SIG = 4;
const MAX_CODE = 64;
const RATE_LIMIT = 60;
const RATE_WINDOW = 10 * 60 * 1000;

// Set PREFS_SECRET on the deployment; the fallback only keeps local
// development working.
const secret = () => process.env.PREFS_SECRET || 'local-dev-prefs-secret';
const sign = (bytes) => createHmac('sha256', secret()).update(bytes).digest().subarray(0, SIG);

const hits = new Map();
function overLimit(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.reset) { hits.set(ip, { n: 1, reset: now + RATE_WINDOW }); return false; }
  rec.n += 1;
  return rec.n > RATE_LIMIT;
}

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > 2000) reject(new Error('Body too large.'));
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('Body is not JSON.')); }
    });
    req.on('error', reject);
  });

const send = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  if (overLimit(ip)) return send(res, 429, { error: 'Too many requests. Try again in a few minutes.' });

  if (req.method === 'POST') {
    let body;
    try {
      body = req.body && typeof req.body === 'object' ? req.body : await readBody(req);
    } catch (err) {
      return send(res, 400, { error: err.message });
    }
    const checked = validate(body?.prefs);
    if (!checked.ok) return send(res, 422, { error: 'Some settings are not valid.', fields: checked.errors });

    const bytes = pack(checked.value);
    const code = group(toBase32(Buffer.concat([Buffer.from(bytes), sign(bytes)])));
    return send(res, 200, { code, prefs: checked.value, bytes: bytes.length + SIG });
  }

  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://local');
    const raw = String(url.searchParams.get('code') || '').slice(0, MAX_CODE);
    if (!raw.trim()) return send(res, 400, { error: 'Paste a code first.' });

    let all;
    try {
      all = fromBase32(raw);
    } catch (err) {
      return send(res, 400, { error: err.message });
    }
    if (all.length <= SIG) return send(res, 400, { error: 'That code is too short.' });

    const bytes = all.subarray(0, all.length - SIG);
    const given = Buffer.from(all.subarray(all.length - SIG));
    if (!timingSafeEqual(given, sign(bytes))) {
      return send(res, 403, { error: 'That code was not issued here, or has a typo.' });
    }

    let prefs;
    try {
      prefs = unpack(bytes);
    } catch (err) {
      return send(res, 400, { error: err.message });
    }
    const checked = validate(prefs);
    if (!checked.ok) return send(res, 422, { error: 'That code holds settings this version does not know.' });
    return send(res, 200, { prefs: checked.value });
  }

  res.setHeader('allow', 'GET, POST');
  return send(res, 405, { error: 'Use GET or POST.' });
}
