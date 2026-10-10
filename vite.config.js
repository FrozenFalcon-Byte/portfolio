import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/* The API routes are serverless functions in production. In development
 * there is no serverless runtime, so mount the same handler as Vite
 * middleware — one implementation, both environments. */
function assistantApi(env) {
  return {
    name: 'assistant-api',
    configureServer(server) {
      // The key is deliberately un-prefixed so Vite never ships it to the
      // browser; hand it to the dev process explicitly instead.
      process.env.GEMINI_API_KEY ||= env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || '';
      process.env.PREFS_SECRET ||= env.PREFS_SECRET || '';

      // Every file in /api that is not a _private module is a route,
      // exactly as on the deployment.
      for (const name of ['ask', 'prefs']) {
        server.middlewares.use(`/api/${name}`, async (req, res, next) => {
          try {
            const mod = await server.ssrLoadModule(`/api/${name}.js`);
            req.url = req.originalUrl || req.url;
            await mod.default(req, res);
          } catch (err) {
            server.config.logger.error(`[api/${name}] ${err.stack || err.message}`);
            if (!res.headersSent) {
              res.writeHead(500, { 'content-type': 'application/json' });
              res.end(JSON.stringify({ error: 'The API failed to start.' }));
            } else next(err);
          }
        });
      }
    },
  };
}

/* The two Latin font files are needed by every page's first paint, but
 * the browser only discovers them after the CSS has downloaded and
 * parsed. Preloading them from the HTML starts both downloads at once,
 * so headings stop swapping fonts after they have already been laid out. */
function preloadFonts() {
  return {
    name: 'preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        return Object.keys(ctx.bundle || {})
          .filter((f) => /(geist|bricolage-grotesque)-latin-wght-normal-[\w-]+\.woff2$/.test(f))
          .map((f) => ({
            tag: 'link',
            attrs: { rel: 'preload', href: `/${f}`, as: 'font', type: 'font/woff2', crossorigin: '' },
            injectTo: 'head',
          }));
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), assistantApi(env), preloadFonts()],
    build: {
      target: 'es2020',
      rollupOptions: {
        output: {
          // Libraries change far less often than the site does. Kept in
          // their own files, a deploy only invalidates the site's code and
          // a returning visitor keeps React and GSAP from cache.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (/[\\/](react|react-dom|scheduler|react-router|react-router-dom|cookie|set-cookie-parser)[\\/]/.test(id)) return 'react';
            if (/[\\/](gsap|lenis)[\\/]/.test(id)) return 'motion';
            return 'vendor';
          },
        },
      },
    },
  };
});
