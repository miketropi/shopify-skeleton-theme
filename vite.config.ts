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
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        theme: resolve(__dirname, 'src/scripts/theme.ts'),
      },
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        chunkFileNames: 'theme-[name].js',
        assetFileNames: (info) => {
          if (info.type === 'asset' && info.names.some((n) => n.endsWith('.css'))) {
            return 'theme.css'
          }
          return '[name].[ext]'
        },
      },
    },
  },
})