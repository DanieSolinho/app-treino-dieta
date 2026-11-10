import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Para publicar no GitHub Pages, troque por '/nome-do-repositorio/'
  base: './',
});
