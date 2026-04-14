import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'assets',
    emptyOutDir: false,
    sourcemap: false,
    rollupOptions: {
      input: {
        theme: resolve(__dirname, 'src/theme.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
})