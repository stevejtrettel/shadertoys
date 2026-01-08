import { defineConfig } from 'vite';
import path from 'path';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

const editorEnabled = process.env.VITE_EDITOR_ENABLED === 'true';

export default defineConfig({
  plugins: [
    cssInjectedByJsPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // When editor is disabled, swap editor modules for empty stubs
      ...(editorEnabled ? {} : {
        '../editor/codemirror': path.resolve(__dirname, './src/editor/stub.ts'),
        '../editor/EditorPanel': path.resolve(__dirname, './src/editor/stub.ts'),
      }),
    },
  },
  define: {
    // Compile-time flag to enable/disable editor code
    __EDITOR_ENABLED__: JSON.stringify(editorEnabled),
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Single JS bundle
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
