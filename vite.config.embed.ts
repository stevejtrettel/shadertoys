import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  plugins: [cssInjectedByJsPlugin()],
  build: {
    lib: {
      entry: 'src/embed.ts',
      formats: ['es'],
      fileName: () => 'embed.js',
    },
    outDir: 'dist-embed',
    rollupOptions: {
      output: {
        inlineDynamicImports: true,  // <-- this is the key
      },
    },
  },
});