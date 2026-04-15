import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        initiatives: resolve(__dirname, 'initiatives.html'),
        contact: resolve(__dirname, 'contact.html'),
      },
    },
  },
});
