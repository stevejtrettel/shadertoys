import { defineConfig } from 'vite';
import path from 'path';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  plugins: [
    cssInjectedByJsPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/main.js',
        chunkFileNames: 'assets/[name].js',
        // Separate CodeMirror into its own chunk (only loaded when editor=true)
        manualChunks(id) {
          if (id.includes('codemirror') || id.includes('@lezer') || id.includes('src/editor/')) {
            return 'editor';
          }
        },
        // Keep original names for images
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          // Images keep their original names
          if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(name)) {
            return 'assets/[name][extname]';
          }
          // Everything else uses content hash
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
