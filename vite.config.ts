import { iwsdkDev } from '@iwsdk/vite-plugin-dev';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, type Plugin } from 'vite';

function quantumTutorApiPlugin(): Plugin {
  return {
    name: 'quantum-tutor-api-middleware',
    configureServer(server) {
      server.middlewares.use('/api/health', async (req, res, next) => {
        if (!req || !res) return next();
        try {
          const mod = await server.ssrLoadModule('/api/health.ts');
          await mod.default(req as IncomingMessage, res as ServerResponse);
        } catch (err) {
          next(err);
        }
      });

      server.middlewares.use('/api/tutor/ask', async (req, res, next) => {
        if (!req || !res) return next();
        try {
          const mod = await server.ssrLoadModule('/api/tutor/ask.ts');
          await mod.default(req as IncomingMessage, res as ServerResponse);
        } catch (err) {
          next(err);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [iwsdkDev(), quantumTutorApiPlugin()],
  server: { host: '0.0.0.0', port: 8082, open: false },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    target: 'esnext',
    rollupOptions: { input: './index.html' },
  },
  esbuild: { target: 'esnext' },
  resolve: {
    dedupe: [
      'three',
      '@pmndrs/uikit',
      '@pmndrs/uikit-horizon',
      '@pmndrs/uikit-lucide',
    ],
  },
  optimizeDeps: {
    exclude: ['@babylonjs/havok'],
    include: [
      'three',
      '@pmndrs/uikit',
      '@pmndrs/uikit-horizon',
      '@pmndrs/uikit-lucide',
      '@drawcall/uikitml',
    ],
    esbuildOptions: { target: 'esnext' },
  },
  publicDir: 'public',
  base: './',
});
