import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../extension-build',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(process.cwd(), 'src/popup.html'),
        studio: resolve(process.cwd(), 'src/studio.html')
      }
    }
  }
});
