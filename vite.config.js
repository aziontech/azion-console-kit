import process from 'process'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

const getConfig = () => {
  const env = loadEnv('development', process.cwd())
  const URLStartPrefix = env.VITE_ENVIRONMENT === 'PRODUCTION' ? 'https://' : 'https://stage-'

  return {
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
          target: `${URLStartPrefix}sso.azion.com/logout`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/logout/, ''),
          cookieDomainRewrite: { '*': '' }
        },
        '/api/edge_services': {
          target: `${URLStartPrefix}api.azion.net`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/edge_services/, '')
        },
        '/api/variables': {
          target: `${URLStartPrefix}manager.azion.com/variables/api/`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        },
        '/api/marketplace': {
          target: `${URLStartPrefix}manager.azion.com/marketplace/api/`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/marketplace/, '')
        },
        '/api/template-engine': {
          target: `${URLStartPrefix}manager.azion.com/template-engine/api/`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/template-engine/, '')
        },
        '/graphql/cities': {
          target: `${URLStartPrefix}cities.azion.com/graphql`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/graphql\/cities/, '')
        },
        '/api/script-runner': {
          target: `${URLStartPrefix}manager.azion.com/script-runner/api/`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/script-runner/, '')
        },
        '/events/graphql': {
          target: `${URLStartPrefix}api.azion.net`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/events\/graphql\//, '')
        },
        '/api/edge_node': {
          target: `${URLStartPrefix}manager.azion.com/edgenode/api/v1/edge-nodes`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/edge_node/, '')
        },
        '/api/iam': {
          target: `${URLStartPrefix}manager.azion.com/iam/api`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/iam/, '')
        },
        '/api/account-details': {
          target: `${URLStartPrefix}iam.azion.com/iam/api/account`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/account-details/, '')
        },
        '/api/teams': {
          target: `${URLStartPrefix}iam.azion.com/iam/api/teams`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/teams/, '')
        },
        '/api/purge': {
          target: 'https://stage-manager.azion.com/api/purge',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/purge/, '')
        },
        '/api/permissions': {
          target: `${URLStartPrefix}iam.azion.com/iam/api/permissions`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/permissions/, '')
        },
        '/api/users': {
          target: `${URLStartPrefix}iam.azion.com/iam/api`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        },
        '/api/credentials': {
          target: `${URLStartPrefix}manager.azion.com/credentials/api/v1/credentials`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/credentials/, '')
        },
        '^/api/(account|user|token|switch-account|password|totp)': {
          target: `${URLStartPrefix}sso.azion.com/api`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          cookieDomainRewrite: { '*': '' }
        },
        '/api': {
          target: `${URLStartPrefix}manager-origin.azion.com/api`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }
}

export default defineConfig(getConfig())
