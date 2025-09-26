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
  const DEBUG_PROXY = env.VITE_DEBUG_PROXY === 'true' && env.VITE_ENVIRONMENT !== 'production'

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
        '@modules': fileURLToPath(new URL('./src/modules', import.meta.url)),
        '@utils': fileURLToPath(new URL('./src/utils', import.meta.url))
      }
    },
    server: {
      host: true,
      historyApiFallback: true,
      proxy: {
        // AI Studio API - MUST be first to avoid conflicts with generic /api rule
        '^/api/v4/workspace/ai': createProxyConfig({
          target: `${URLStartPrefix}ai-studio-api.azion.net/`,
          rewrite: (path) => {
            console.log(`🚀 AI Studio API Proxy (with /api prefix) MATCHED!`)
            console.log(`   Original path: ${path}`)
            const cleanPath = path.replace(/^\/api/, '')
            console.log(`   Clean path (removed /api): ${cleanPath}`)
            console.log(`   Target: ${URLStartPrefix}ai-studio-api.azion.net${cleanPath}`)
            console.log(`   Full target URL: ${URLStartPrefix}ai-studio-api.azion.net${cleanPath}`)
            return cleanPath
          },
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log(`🌐 AI API PROXY REQUEST INTERCEPTED:`)
              console.log(`   Method: ${proxyReq.method}`)
              console.log(`   Original URL: ${req.url}`)
              console.log(`   Proxy Path: ${proxyReq.path}`)
              console.log(`   Host: ${proxyReq.getHeader('host')}`)
              console.log(`   Target URL: ${options.target}${proxyReq.path}`)
              console.log(`   Headers:`, proxyReq.getHeaders())
            })
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log(`📥 AI API PROXY RESPONSE:`)
              console.log(`   Status: ${proxyRes.statusCode}`)
              console.log(`   Headers:`, proxyRes.headers)
            })
            proxy.on('error', (err, req, res) => {
              console.log(`❌ AI API PROXY ERROR:`, err.message)
            })
          }
        }),
        // AI Studio API (direct v4 paths) - Fallback for direct calls
        '^/v4/workspace/ai': createProxyConfig({
          target: `${URLStartPrefix}ai-studio-api.azion.net/`,
          rewrite: (path) => {
            console.log(`🚀 AI Studio API Proxy MATCHED!`)
            console.log(`   Original path: ${path}`)
            console.log(`   Target: ${URLStartPrefix}ai-studio-api.azion.net${path}`)
            console.log(`   Full target URL: ${URLStartPrefix}ai-studio-api.azion.net${path}`)
            return path
          },
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log(`🌐 PROXY REQUEST INTERCEPTED:`)
              console.log(`   Method: ${proxyReq.method}`)
              console.log(`   Path: ${proxyReq.path}`)
              console.log(`   Host: ${proxyReq.getHeader('host')}`)
              console.log(`   Full URL: ${options.target}${proxyReq.path}`)
              console.log(`   Headers:`, proxyReq.getHeaders())
            })
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log(`📥 PROXY RESPONSE:`)
              console.log(`   Status: ${proxyRes.statusCode}`)
              console.log(`   Headers:`, proxyRes.headers)
            })
            proxy.on('error', (err, req, res) => {
              console.log(`❌ PROXY ERROR:`, err.message)
            })
          }
        }),
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
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log(`⚠️ GENERIC /v4 PROXY MATCHED (should not happen for AI requests):`)
              console.log(`   Method: ${proxyReq.method}`)
              console.log(`   Path: ${proxyReq.path}`)
              console.log(`   Target: ${options.target}${proxyReq.path}`)
            })
          }
        }),
        '/webpagetest': createProxyConfig({
          target: 'https://www.azion.com/api/webpagetest',
          rewrite: (path) => path.replace(/^\/webpagetest/, '')
        }),
        '/webpagetest-external': createProxyConfig({
          target: 'https://www.azion.com/api/webpagetest',
          rewrite: (path) => path.replace(/^\/webpagetest-external/, '')
        }),
        '^/api/ai/copilot': createProxyConfig({
          target: `${URLStartPrefix}ai.azion.com/copilot/chat/completions`,
          rewrite: (path) => path.replace(/^\/api\/ai\/copilot/, '')
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
