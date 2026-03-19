import { connect as connectHttp2 } from 'node:http2'

/**
 * Headers that should not be forwarded in the response
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#hop-by-hop_headers
 */
const HOP_BY_HOP_RESPONSE_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade'
])

/**
 * Creates a Vite plugin that proxies SSE requests using HTTP/2
 *
 * This is necessary because the default Vite proxy (http-proxy-3) only supports
 * HTTP/1.1 for upstream connections. SSE streams require HTTP/2 to work properly
 * with certain backends.
 *
 * @param {Object} options - Plugin options
 * @param {string} options.target - The target URL for the SSE endpoint (e.g., 'https://api.example.com')
 * @param {string} [options.path='/v4/sse'] - The path prefix to intercept for SSE proxying
 * @returns {import('vite').Plugin} Vite plugin
 */
export function sseHttp2ProxyPlugin({ target, path = '/v4/sse' }) {
  return {
    name: 'sse-http2-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith(path)) {
          return next()
        }

        const session = connectHttp2(target)
        const requestHeaders = {
          ':method': 'GET',
          ':path': req.url,
          accept: 'text/event-stream',
          ...(req.headers.cookie ? { cookie: req.headers.cookie } : {}),
          ...(req.headers['last-event-id']
            ? { 'last-event-id': req.headers['last-event-id'] }
            : {}),
          ...(req.headers['user-agent'] ? { 'user-agent': req.headers['user-agent'] } : {})
        }
        const upstream = session.request(requestHeaders)
        let isClosed = false

        const cleanup = () => {
          if (isClosed) return
          isClosed = true
          upstream.close()
          session.close()
        }

        const handleError = (error) => {
          if (isClosed) return

          if (!res.headersSent && !res.writableEnded) {
            server.config.logger.error(`[SSE HTTP/2 Proxy] ${error.message}`)
            res.writeHead(502, { 'Content-Type': 'text/plain' })
            res.end('SSE proxy error')
          } else {
            res.destroy(error)
          }

          cleanup()
        }

        session.on('error', handleError)
        upstream.on('error', handleError)

        upstream.on('response', (headers) => {
          const statusCode = Number(headers[':status'] || 200)
          const responseHeaders = Object.fromEntries(
            Object.entries(headers).filter(([key]) => {
              return !key.startsWith(':') && !HOP_BY_HOP_RESPONSE_HEADERS.has(key)
            })
          )

          if (statusCode === 200) {
            responseHeaders['content-type'] = 'text/event-stream'
            responseHeaders['cache-control'] = 'no-cache'
            responseHeaders['connection'] = 'keep-alive'
          }

          res.writeHead(statusCode, responseHeaders)
          res.flushHeaders?.()
        })

        upstream.on('data', (chunk) => {
          res.write(chunk)
        })

        upstream.on('end', () => {
          if (!res.writableEnded) {
            res.end()
          }

          cleanup()
        })

        req.on('close', cleanup)
        res.on('close', cleanup)

        upstream.end()
      })
    }
  }
}

export default sseHttp2ProxyPlugin
