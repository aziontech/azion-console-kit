import { fileURLToPath, URL } from 'node:url'
import process from 'process'

import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig, loadEnv } from 'vite'
import istanbul from 'vite-plugin-istanbul'

const getConfig = () => {
  const env = loadEnv('development', process.cwd())
  const URLStartPrefix = env.VITE_ENVIRONMENT === 'production' ? 'https://' : 'https://stage-'

  return {
    plugins: [
      vue(),
      vueJsx(),
      istanbul({
        nycrcPath: '.nycrc'
      })
    ],
    resolve: {
      extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue'],
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@templates': fileURLToPath(new URL('./src/templates', import.meta.url)),
        '@views': fileURLToPath(new URL('./src/views', import.meta.url)),
        '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
        '@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
        '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
        '@routes': fileURLToPath(new URL('./src/router/routes', import.meta.url)),
        '@modules': fileURLToPath(new URL('./src/modules', import.meta.url))
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
        '^/api/vcs': {
          target: `${URLStartPrefix}vcs-api.azion.net/`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/vcs/, '/vcs/api')
        },
        '/graphql/cities': {
          target: `${URLStartPrefix}cities.azion.com`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/graphql\/cities/, '/graphql')
        },
        '/graphql/billing': {
          target: `${URLStartPrefix}manager.azion.com`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/graphql\/billing/, '/billing/graphql')
        },
        '/api/webhook/console_feedback': {
          target: `https://automate.azion.net/`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
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
        },
        '/ai': {
          target: 'https://ivg5gk272b.map.azionedge.net',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ai/, '/chat-completions')
        },
        '/webpagetest': {
          target: `https://www.azion.com/api/webpagetest`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/webpagetest/, '')
        },
        '/webpagetest-external': {
          target: `https://www.azion.com/api/webpagetest`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/webpagetest-external/, '')
        },
      }
    }
  }
}

export default defineConfig(getConfig())
