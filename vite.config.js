import { fileURLToPath, URL } from 'node:url'
import process from 'process'

import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig, loadEnv } from 'vite'
import istanbul from 'vite-plugin-istanbul'
import { sentryVitePlugin } from '@sentry/vite-plugin'

const getConfig = () => {
  const env = loadEnv('development', process.cwd())
  const IS_SENTRY_UPLOAD = env.VITE_SENTRY_UPLOAD === 'true'
  const IS_PROD = env.VITE_ENVIRONMENT === 'production'
  const URLStartPrefix = IS_PROD ? 'https://' : 'https://stage-'
  const DomainSuffix = IS_PROD ? 'net' : 'com'
  const DEBUG_PROXY = env.VITE_DEBUG_PROXY === 'true' && !IS_PROD

  const createProxyConfig = ({ target, rewrite, changeOrigin = true, cookieDomainRewrite }) => ({
    target,
    changeOrigin,
    ...(rewrite && { rewrite }),
    ...(cookieDomainRewrite && { cookieDomainRewrite }),
    ...(DEBUG_PROXY && {
      configure: (proxy, options) => {
        proxy.on('proxyReq', (proxyReq, req) => {
          const originalUrl = `https://${req.headers.host}${req.url}`
          const targetUrl = options.target
          const proxiedUrl = `${targetUrl}${req.url}`

          // eslint-disable-next-line no-console
          console.log(`[Vite Proxy] ${req.method} ${originalUrl} => ${proxiedUrl}`)
        })
      }
    })
  })

  return {
    build: {
      sourcemap: IS_SENTRY_UPLOAD ? 'hidden' : 'inline'
    },
    define: {
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
    },
    plugins: [
      vue(),
      vueJsx(),
      istanbul({
        nycrcPath: '.nycrc'
      }),
      ...(IS_SENTRY_UPLOAD && env.VITE_SENTRY_AUTH_TOKEN?.length
        ? [
            sentryVitePlugin({
              org: 'azion-technologies',
              project: IS_PROD ? 'console' : 'console-stage',
              authToken: env.VITE_SENTRY_AUTH_TOKEN,
              sourcemaps: { assets: './dist/assets/**' }
            })
          ]
        : [])
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
        '@modules': fileURLToPath(new URL('./src/modules', import.meta.url)),
        '@utils': fileURLToPath(new URL('./src/utils', import.meta.url))
      }
    },
    server: {
      proxy: {
        '^/api/marketplace': createProxyConfig({
          target: `${URLStartPrefix}marketplace.azion.com/`,
          rewrite: (path) => path.replace(/^\/api\/marketplace/, '/marketplace/api')
        }),
        '^/api/script-runner': createProxyConfig({
          target: `${URLStartPrefix}script-runner.azion.${DomainSuffix}/`,
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
          target: `${URLStartPrefix}console.azion.com`
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
          target: `${URLStartPrefix}api.azion.com`
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
