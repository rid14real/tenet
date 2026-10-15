import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `--mode artifact` builds one self-contained HTML file backed by the claude.ai artifact database.
export default defineConfig(({ mode }) => ({
  plugins: mode === 'artifact' ? [react(), viteSingleFile()] : [react()],
  define: mode === 'artifact' ? { 'import.meta.env.VITE_STORE': JSON.stringify('artifact') } : undefined,
  build: { outDir: mode === 'artifact' ? 'dist-artifact' : 'dist', target: 'es2020' },
  server: { port: 5173, proxy: { '/api': 'http://localhost:4000' } },
}));
