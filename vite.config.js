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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), assistantApi(env)],
    build: { target: 'es2020' },
  };
});
