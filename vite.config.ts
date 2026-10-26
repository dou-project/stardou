/// <reference types="vitest" />

import path from 'path'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Unocss from 'unocss/vite'

export default defineConfig({
  // GitHub Pages serves the site under /<repo>/, see .github/workflows/deploy.yml
  base: process.env.BASE_PATH || '/',
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`,
      '@hankit/tools': path.resolve(__dirname, 'packages/tools/src/index.ts'),
    },
  },
  define: {
    'import.meta.vitest': 'false',
  },
  plugins: process.env.TEST
    ? []
    : [
        Vue(),
        AutoImport({
          imports: [
            'vue',
            '@vueuse/core',
          ],
          dts: true,
        }),
        Components({
          dts: true,
        }),
        Unocss(),
      ],
  test: {
    includeSource: ['packages/*/src/**/*.ts'],
  },
  build: {
    // the strict-mode poem corpora are large but only fetched on demand
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('locale'))
            return 'locale'
          if (id.includes('idioms.txt'))
            return 'idioms'
          if (id.includes('polyphones.json'))
            return 'polyphones'
          // accounts only, fetched on demand by src/cloud.ts
          if (id.includes('@supabase'))
            return 'supabase'
          if (id.includes('node_modules') && !id.endsWith('.css'))
            return 'vendor'
        },
      },
    },
  },
})
