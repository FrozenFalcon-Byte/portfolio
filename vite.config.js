import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/* The assistant is a serverless function in production. In development
 * there is no serverless runtime, so mount the same handler as Vite
 * middleware — one implementation, both environments. */
function assistantApi(env) {
  return {
    name: 'assistant-api',
    configureServer(server) {
      // The key is deliberately un-prefixed so Vite never ships it to the
      // browser; hand it to the dev process explicitly instead.
      process.env.GEMINI_API_KEY ||= env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || '';

      server.middlewares.use('/api/ask', async (req, res, next) => {
        try {
          const mod = await server.ssrLoadModule('/api/ask.js');
          await mod.default(req, res);
        } catch (err) {
          server.config.logger.error(`[assistant] ${err.stack || err.message}`);
          if (!res.headersSent) {
            res.writeHead(500, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ error: 'The assistant failed to start.' }));
          } else next(err);
        }
      });
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
