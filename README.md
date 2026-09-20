# Portfolio — Ajinkya Chavan

React + Vite. Light by default with a dark toggle, GSAP/ScrollTrigger on a
single Lenis clock, and a small grounded-answer assistant behind a
serverless function.

## Run it

```bash
npm install
cp .env.example .env    # then paste your Google AI Studio key
npm run dev
```

`npm run build` writes `dist/`.

## The assistant

`POST /api/ask` embeds the visitor's question, ranks it against the
passages in `api/_knowledge.js`, and asks Gemini to answer from the top
matches only — citing them, or admitting the corpus does not cover the
question. It streams back as server-sent events.

- The key is read from `GEMINI_API_KEY` and never leaves the server. It is
  deliberately **not** `VITE_`-prefixed: anything with that prefix is
  inlined into the browser bundle.
- In development the same handler is mounted as Vite middleware
  (`vite.config.js`), so there is one implementation for both environments.
- Requests are rate limited per address. Without a key the endpoint
  returns 503 and the section degrades to an error message rather than
  breaking the page.

To change what it knows, edit `api/_knowledge.js`. Chunk embeddings are
built once per cold start and cached in module scope.

## Layout

```
api/            serverless function + its corpus
src/lib/        motion vocabulary (GSAP helpers) and theme
src/components/ one file per section, styles colocated
src/pages/      Home and the Emerson case study (/experience/pmo)
```

Colour never appears in a component. Sections carry `data-tone`, which
swaps the token set (`src/index.css`), so the same markup reads correctly
on a cream, lilac, acid or ink block, in either theme.
