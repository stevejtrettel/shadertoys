import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
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
        // Single JS bundle - inline all dynamic imports
        inlineDynamicImports: true,
        entryFileNames: 'assets/main.js',
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
