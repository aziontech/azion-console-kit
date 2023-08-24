import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
  ],
  resolve: {
    extensions:['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json','.vue'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@templates': fileURLToPath(new URL('./src/templates', import.meta.url)),
      '@views': fileURLToPath(new URL('./src/views', import.meta.url)),
      '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
      '@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://cors-stage-api.azion.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/graphql': {
        target: 'http://iahcel0b0f.map.azionedge.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/graphql/, ''),
      }
    }
  }

})
