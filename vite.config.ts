import { defineConfig } from 'vitest/config';
import { loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Em desenvolvimento, serve as funções de /api pelo próprio Vite (sem precisar da CLI da Vercel).
 * As variáveis vêm do .env.local (fora do Git). Em produção, quem roda /api é a Vercel.
 */
function apiInDev(env: Record<string, string>): Plugin {
  return {
    name: 'api-in-dev',
    configureServer(server) {
      Object.assign(process.env, env);
      server.middlewares.use('/api/analyze-label', async (req, res) => {
        const { POST } = await server.ssrLoadModule('/api/analyze-label.ts');
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const request = new Request('http://localhost/api/analyze-label', {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
        });
        const response: Response = await POST(request);
        res.statusCode = response.status;
        response.headers.forEach((value, key) => res.setHeader(key, value));
        res.end(await response.text());
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), apiInDev(loadEnv(mode, process.cwd(), ''))],
  // Para publicar no GitHub Pages, troque por '/nome-do-repositorio/'
  base: './',
  test: {
    setupFiles: ['./src/test/setup.ts'],
  },
}));
