/* global Azion */

/**
 * Signals Proxy — Edge Function
 *
 * Receives /signals/{e,i,p} from the console client, validates payloads, and
 * forwards them to the upstream telemetry vendor with the write key injected
 * server-side (never exposed to the browser).
 *
 * Mirrors the behavior of the equivalent edge function on the marketing site,
 * so console and site share a consistent identity model. Future: extract this
 * + the site equivalent into a single `@aziontech/signals` package.
 *
 * Write key is read via `Azion.env.get(...)` — the official Environment
 * Variables API (https://www.azion.com/en/documentation/products/functions/environment-variables/).
 * Register `SIGNALS_WRITE_KEY` once per account in the Azion Console UI.
 */

const UPSTREAM_BASE_URL = 'https://api.segment.io'

const PATH_MAP = {
  '/signals/e': '/v1/track',
  '/signals/i': '/v1/identify',
  '/signals/p': '/v1/page'
}

const FORWARD_TIMEOUT_MS = 5000
const MAX_USER_AGENT_LENGTH = 512

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const resolveUserId = (raw) => {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (EMAIL_RE.test(trimmed)) return null
  if (trimmed === 'undefined') return null
  if (trimmed.startsWith('anon_')) return null
  return trimmed
}

const log = (level, event, extra = {}) => {
  const entry = JSON.stringify({
    level,
    tag: 'signals-proxy',
    event,
    ts: Date.now(),
    ...extra
  })
  if (level === 'error') {
    // eslint-disable-next-line no-console
    console.error(entry)
  } else {
    // eslint-disable-next-line no-console
    console.warn(entry)
  }
}

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })

const readWriteKey = () => {
  if (typeof Azion !== 'undefined' && Azion?.env?.get) {
    return Azion.env.get('SIGNALS_WRITE_KEY') || ''
  }
  return ''
}

const resolveRealIp = (request) => {
  const fromMetadata = request?.metadata?.remote_addr
  if (fromMetadata) return fromMetadata
  return (
    request.headers.get('X-Real-IP') ||
    request.headers.get('X-Forwarded-For') ||
    request.headers.get('X-User-Real-IP') ||
    ''
  )
}

const handle = async (request) => {
  if (request.method !== 'POST') {
    return json(405, { error: 'Method Not Allowed' })
  }

  const url = new URL(request.url)
  const upstreamPath = PATH_MAP[url.pathname]
  if (!upstreamPath) {
    return json(404, { error: 'Not Found' })
  }

  let body
  try {
    body = await request.json()
  } catch (parseError) {
    log('error', 'invalid_json', { msg: parseError?.message })
    return json(400, { error: 'Invalid JSON' })
  }

  if (upstreamPath === '/v1/track' && !body.event) {
    return json(400, { error: 'event is required' })
  }

  const realIp = resolveRealIp(request)
  const userAgent = (request.headers.get('User-Agent') || '').slice(0, MAX_USER_AGENT_LENGTH)

  const payload = {
    ...body,
    userId: resolveUserId(body.userId),
    context: {
      ...(body.context || {}),
      ...(realIp ? { ip: realIp } : {}),
      ...(userAgent ? { userAgent } : {})
    }
  }

  const writeKey = readWriteKey()
  if (!writeKey) {
    log('error', 'missing_write_key')
    return json(500, { error: 'Signals not configured' })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FORWARD_TIMEOUT_MS)

  try {
    const upstreamResponse = await fetch(`${UPSTREAM_BASE_URL}${upstreamPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(writeKey + ':')}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    })

    if (!upstreamResponse.ok) {
      log('error', 'upstream_non_2xx', { status: upstreamResponse.status, path: upstreamPath })
      return json(502, { error: 'Upstream error', status: upstreamResponse.status })
    }

    return json(200, { status: 'sent' })
  } catch (forwardError) {
    if (forwardError?.name === 'AbortError') {
      log('error', 'forward_timeout', { path: upstreamPath })
      return json(502, { error: 'Upstream timeout' })
    }
    log('error', 'forward_failed', { msg: forwardError?.message, path: upstreamPath })
    return json(500, { error: 'Internal error' })
  } finally {
    clearTimeout(timeoutId)
  }
}

addEventListener('fetch', (event) => {
  event.respondWith(handle(event.request))
})
