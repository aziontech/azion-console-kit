import { fileURLToPath, URL } from 'node:url'
import process from 'process'

import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig, loadEnv } from 'vite'
import istanbul from 'vite-plugin-istanbul'

const getConfig = () => {
  const env = loadEnv('development', process.cwd())
  const URLStartPrefix = env.VITE_ENVIRONMENT === 'production' ? 'https://' : 'https://stage-'
  const DomainSuffix = env.VITE_ENVIRONMENT === 'production' ? 'com' : 'net'
  const DEBUG_PROXY = env.VITE_DEBUG_PROXY === 'production' ? false : true

  const createProxyConfig = ({ target, rewrite = null }) => ({
    target,
    changeOrigin: true,
    rewrite,
    configure: (proxy, options) => {
      if (DEBUG_PROXY) {
        proxy.on('proxyReq', (proxyReq, req) => {
          const originalUrl = `https://${req.headers.host}${req.url}`
          const targetUrl = options.target
          const proxiedUrl = `${targetUrl}${req.url}`
          
          // eslint-disable-next-line no-console
          console.log(`[Vite Proxy] ${req.method} ${originalUrl} => ${proxiedUrl}`)
        })
      }
    }
  })

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
        '^/api/marketplace': createProxyConfig({
          target: `${URLStartPrefix}marketplace.azion.com/`,
          rewrite: (path) => path.replace(/^\/api\/marketplace/, '/marketplace/api')
        }),
        '^/api/script-runner': createProxyConfig({
          target: `${URLStartPrefix}script-runner.azion.com/`,
          rewrite: (path) => path.replace(/^\/api\/script-runner/, '/script-runner/api')
        }),
        '^/api/template-engine': createProxyConfig({
          target: `${URLStartPrefix}template-engine.azion.com/`,
          rewrite: (path) => path.replace(/^\/api\/template-engine/, '/template-engine/api')
        }),
        '^/api/iam': createProxyConfig({
          target: `${URLStartPrefix}iam-api.azion.net/`,
          rewrite: (path) => path.replace(/^\/api\/iam/, '/iam/api')
        }),
        '^/api/vcs': createProxyConfig({
          target: `${URLStartPrefix}vcs-api.azion.net/`,
          rewrite: (path) => path.replace(/^\/api\/vcs/, '/vcs/api')
        }),
        '/graphql/cities': createProxyConfig({
          target: `${URLStartPrefix}cities.azion.${DomainSuffix}`,
          rewrite: (path) => path.replace(/^\/graphql\/cities/, '/graphql')
        }),
        '/api/webhook/console_feedback': createProxyConfig({
          target: 'https://automate.azion.net/',
          rewrite: (path) => path.replace(/^\/api/, '')
        }),
        '^/api/(account|user|token|switch-account|auth|password|totp)|^/logout': createProxyConfig({
          target: `${URLStartPrefix}sso.azion.com`,
          cookieDomainRewrite: { '*': '' }
        }),
        '/api': createProxyConfig({
          target: `${URLStartPrefix}api.azion.com`,
          rewrite: (path) => path.replace(/^\/api/, '')
        }),
        '/v4': createProxyConfig({
          target: `${URLStartPrefix}api.azion.com`,
          changeOrigin: true
        }),
        '/webpagetest': createProxyConfig({
          target: 'https://www.azion.com/api/webpagetest',
          rewrite: (path) => path.replace(/^\/webpagetest/, '')
        }),
        '/webpagetest-external': createProxyConfig({
          target: 'https://www.azion.com/api/webpagetest',
          rewrite: (path) => path.replace(/^\/webpagetest-external/, '')
        }),
        '/ai': createProxyConfig({
          target: `${URLStartPrefix}ai.azion.com/copilot/chat/completions`,
          rewrite: (path) => path.replace(/^\/ai/, '')
        }),
        '/graphql/accounting': createProxyConfig({
          target: `${URLStartPrefix}console.azion.com`,
          rewrite: (path) => path.replace(/^\/graphql\/accounting/, '/accounting/graphql')
        })
      }
    }
  }
}

export default defineConfig(getConfig())
