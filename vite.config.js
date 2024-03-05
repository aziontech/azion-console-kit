import { fileURLToPath, URL } from 'node:url'
import process from 'process'

import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig, loadEnv } from 'vite'

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
        '^/api/(marketplace|script-runner|template-engine)': {
          target: `${URLStartPrefix}manager.azion.com/`,
          changeOrigin: true,
          rewrite: (path) =>
            path.replace(/^\/api\/(marketplace|script-runner|template-engine)/, '/$1/api')
        },
        '/graphql/cities': {
          target: `${URLStartPrefix}cities.azion.com`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/graphql\/cities/, '/graphql')
        },
        '/metrics/graphql': {
          target: `${URLStartPrefix}manager.azion.com/metrics/graphql`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/metrics\/graphql/, '')
        },
        '^/api/(account|user|token|switch-account|auth|password|totp)|^/logout': {
          target: `${URLStartPrefix}sso.azion.com`,
          changeOrigin: true,
          cookieDomainRewrite: { '*': '' }
        },
        '/api': {
          target: `${URLStartPrefix}api.azion.com`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }
}

export default defineConfig(getConfig())
