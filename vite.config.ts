import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

function localApiPlugin(): Plugin {
  return {
    name: 'local-api-handlers',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const reqUrl = req.url || '';
        if (!reqUrl.startsWith('/api/')) {
          return next();
        }

        // Decora res.status e res.json para compatibilidade com handlers da Vercel
        if (!(res as any).status) {
          (res as any).status = (code: number) => {
            res.statusCode = code;
            return res;
          };
        }
        if (!(res as any).json) {
          (res as any).json = (data: any) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return res;
          };
        }

        let rawBody = '';
        req.on('data', (chunk: any) => {
          rawBody += chunk;
        });

        req.on('end', async () => {
          try {
            if (rawBody) {
              (req as any).body = JSON.parse(rawBody);
            }
          } catch {
            (req as any).body = {};
          }

          const parsed = new URL(reqUrl, `http://${req.headers.host || 'localhost'}`);
          (req as any).query = Object.fromEntries(parsed.searchParams.entries());

          try {
            if (parsed.pathname === '/api/sync') {
              const syncMod = await import('./api/sync');
              return await syncMod.default(req, res);
            }
            if (parsed.pathname === '/api/room') {
              const roomMod = await import('./api/room');
              return await roomMod.default(req, res);
            }
            if (parsed.pathname === '/api/block') {
              const blockMod = await import('./api/block');
              return await blockMod.default(req, res);
            }
            if (parsed.pathname === '/api/health') {
              const healthMod = await import('./api/health');
              return await healthMod.default(req, res);
            }
            (res as any).status(404).json({ error: 'Endpoint de API não encontrado.' });
          } catch (err: any) {
            console.error('Erro no handler local da API:', err);
            (res as any).status(500).json({ error: err.message || 'Erro interno no servidor local.' });
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '');
  process.env.DATABASE_URL = env.DATABASE_URL || env.VITE_DATABASE_URL || process.env.DATABASE_URL;

  return {
    plugins: [
      react(),
      legacy({
        targets: ['chrome >= 30', 'android >= 4.4', 'ios >= 9', 'safari >= 9'],
        additionalLegacyPolyfills: [
          'regenerator-runtime/runtime',
          'whatwg-fetch',
          'fast-text-encoding',
          'abortcontroller-polyfill/dist/abortcontroller-polyfill-only',
        ],
        renderModernChunks: true,
      }),
      // Executa os handlers da API localmente apenas durante o dev server
      command === 'serve' ? localApiPlugin() : undefined,
    ].filter(Boolean),
    server: {
      port: 3000,
    },
  };
});
