import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  plugins: [
    {
      name: 'spa-fallback',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const url = (req.url || '').split('?')[0];
          if (url === '/setup') {
            req.url = '/index.html';
          }
          next();
        });
      },
    },
  ],
  server: {
    port: 4174,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
