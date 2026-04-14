import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        // Allow `@use 'foo'` from this folder without repeating paths
        loadPaths: [resolve(__dirname, 'src/styles')],
      },
    },
  },
  build: {
    outDir: 'assets',
    emptyOutDir: false,
    sourcemap: false,
    rollupOptions: {
      input: {
        theme: resolve(__dirname, 'src/scripts/theme.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
})