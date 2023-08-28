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
      '/api/variables': {
        //target: 'https://cors-stage-api.azion.net',
        target: 'https://stage-manager.azion.com/variables/api/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/network-list/graphql': {
        target: 'https://stage-cities.azion.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/network-list\/graphql/, ''),
      },
      '/api': {
        target: 'https://stage-manager-origin.azion.com/api/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
})
