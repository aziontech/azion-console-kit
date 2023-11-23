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
        '/graphql/cities': {
          target: `${URLStartPrefix}cities.azion.com/graphql`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/graphql\/cities/, '')
        },
        '^/api/(marketplace|script-runner)': {
          target: `${URLStartPrefix}manager.azion.com/`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/(marketplace|script-runner)/, '/$1/api')
        },
        '/api/account-details': {
          target: `${URLStartPrefix}iam.azion.com/iam/api/account`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/account-details/, '')
        },
        '^/api/(account|user|token|switch-account|password|totp)|^/logout': {
          target: `${URLStartPrefix}sso.azion.com`,
          changeOrigin: true,
          cookieDomainRewrite: { '*': '' }
        },
        '/api': {
          target: `${URLStartPrefix}api.azion.net`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }
}

export default defineConfig(getConfig())
