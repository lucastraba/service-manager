import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.ts',
      name: 'ServiceManager',
      fileName: () => `index.js`,
      formats: ['es'],
    },
  },
  plugins: [
    dts({
      exclude: ['**/*.spec.ts'],
    }),
  ],
});
