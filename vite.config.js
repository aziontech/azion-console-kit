import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@templates': fileURLToPath(new URL('./src/templates', import.meta.url)),
      '@views': fileURLToPath(new URL('./src/views', import.meta.url)),
      '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
      '@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      '@routes': fileURLToPath(new URL('./src/router/routes', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/logout': {
        target: 'https://stage-sso.azion.com/logout',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/logout/, ''),
        cookieDomainRewrite: { '*': '' }
      },
      '/api/edge-services': {
        target: 'https://stage-manager-origin.azion.com/services/api/v1/services',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/edge-services/, '')
      },
      '/api/script-runner': {
        target: 'https://stage-manager.azion.com/script-runner/api/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/script-runner/, '')
      },
      '/api/variables': {
        target: 'https://stage-manager.azion.com/variables/api/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/network-lists/graphql': {
        target: 'https://stage-cities.azion.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/network-lists\/graphql/, '')
      },
      '/events/graphql': {
        target: 'https://stage-api.azion.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/events\/graphql\//, '')
      },
      '/api/edge_node': {
        target: 'https://stage-manager.azion.com/edgenode/api/v1/edge-nodes',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/edge_node/, '')
      },
      '/api/iam': {
        target: 'https://stage-manager.azion.com/iam/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/iam/, '')
      },
      '/api/account-details': {
        target: 'https://stage-iam.azion.com/iam/api/account',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/account-details/, '')
      },
      '/api/teams': {
        target: 'https://stage-iam.azion.com/iam/api/teams',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/teams/, '')
      },
      '/api/permissions': {
        target: 'https://stage-iam.azion.com/iam/api/permissions',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/permissions/, '')
      },
      '/api/users': {
        target: 'https://stage-iam.azion.com/iam/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/api/credentials': {
        target: 'https://stage-manager.azion.com/credentials/api/v1/credentials',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/credentials/, '')
      },
      '^/api/(account|user|token|switch-account|password|totp)': {
        target: 'https://stage-sso.azion.com/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        cookieDomainRewrite: { '*': '' }
      },
      '/api': {
        target: 'https://stage-manager-origin.azion.com/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
