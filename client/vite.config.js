import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build:demo` makes one self-contained HTML file that runs without the backend
// (bookings are saved in the browser), so it can be hosted free on GitHub Pages.
export default defineConfig(({ mode }) => ({
  plugins: mode === 'demo' ? [react(), viteSingleFile()] : [react()],
  base: './',
  build: { outDir: mode === 'demo' ? '../docs' : 'dist', emptyOutDir: true },
  server: { proxy: { '/api': 'http://localhost:5000' } },
}));
