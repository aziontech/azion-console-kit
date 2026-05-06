/**
 * Cookie utilities for cross-domain identity sharing between
 * www.azion.com (site) and console.azion.com (console).
 *
 * Two cookies live under Domain=.azion.com:
 *  - azion_anonymous_id : UUID assigned per-device, stable across sessions.
 *  - azion_user_id      : public user identifier, written after auth, cleared
 *                         on logout. Never carries tokens or secrets.
 *
 * NOTE: When PR #3504 (fix: hubspot tracking) merges, this file will also
 * gain `getHubSpotUtk` and `getHubSpotContext`. For now, the merge is
 * pending — keep these identity helpers self-contained.
 */

const ANONYMOUS_ID_COOKIE = 'azion_anonymous_id'
const USER_ID_COOKIE = 'azion_user_id'
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365
const MAX_USER_ID_LENGTH = 3500

/**
 * In-memory fallback for the anonymous id when cookies are blocked or rejected
 * by the browser. Without this, every call to getAzionAnonymousId() would
 * return a fresh UUID and break Segment's identity stitching.
 */
let inMemoryAnonymousId = null

const log = (level, event, extra = {}) => {
  const entry = JSON.stringify({ level, tag: 'cookies', event, ts: Date.now(), ...extra })
  if (level === 'error') {
    // eslint-disable-next-line no-console
    console.error(entry)
  } else {
    // eslint-disable-next-line no-console
    console.warn(entry)
  }
}

const cookieRegexCache = Object.create(null)

const getCookieRegex = (name) => {
  if (!cookieRegexCache[name]) {
    cookieRegexCache[name] = new RegExp(`(?:^|;\\s*)${name}=([^;]*)`)
  }
  return cookieRegexCache[name]
}

const getCookieDomain = () => {
  if (typeof window === 'undefined') return
  const host = window.location.hostname
  if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return
  return '.azion.com'
}

const writeCookie = (name, value, { maxAgeSeconds, domain } = {}) => {
  if (typeof document === 'undefined') return
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'SameSite=Lax']
  if (typeof maxAgeSeconds === 'number') parts.push(`Max-Age=${maxAgeSeconds}`)
  if (domain) parts.push(`Domain=${domain}`)
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    parts.push('Secure')
  }
  document.cookie = parts.join('; ')
}

const getCookie = (name) => {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(getCookieRegex(name))
  if (!match) return undefined
  try {
    return decodeURIComponent(match[1])
  } catch {
    return undefined
  }
}

/**
 * Web Crypto API standard — UUID v4. Available in all Chromium-based browsers
 * since 2021 (Chrome 92+, Opera 78+). Requires secure context (HTTPS or
 * localhost), which prod/stage/dev all satisfy. Returns undefined on the rare
 * failure path so callers can degrade gracefully without throwing.
 */
const generateUuid = () => {
  try {
    return crypto.randomUUID()
  } catch (err) {
    log('error', 'uuid_generation_failed', { msg: err?.message })
    return undefined
  }
}

const persistAnonymousId = (id) => {
  if (!id) return undefined
  try {
    writeCookie(ANONYMOUS_ID_COOKIE, id, {
      maxAgeSeconds: ONE_YEAR_SECONDS,
      domain: getCookieDomain()
    })
    // Verify the cookie actually persisted. If browser blocks cookies (strict
    // privacy mode, third-party blocking on cross-domain, etc), fall back to
    // an in-memory singleton so the session at least stays consistent.
    const persisted = getCookie(ANONYMOUS_ID_COOKIE)
    if (persisted !== id) {
      inMemoryAnonymousId = id
      log('warn', 'cookie_blocked', { cookie: ANONYMOUS_ID_COOKIE })
    } else {
      inMemoryAnonymousId = null
    }
  } catch (err) {
    inMemoryAnonymousId = id
    log('error', 'persist_anonymous_id_failed', { msg: err?.message })
  }
  return id
}

/**
 * Reads the anonymous_id from cookie. Generates a new UUID and persists it
 * if missing. Result is shared with the site via Domain=.azion.com.
 *
 * Falls back to an in-memory singleton when cookies are blocked, so the
 * anonymous id stays stable across calls within the same page session.
 */
export const getAzionAnonymousId = () => {
  const fromCookie = getCookie(ANONYMOUS_ID_COOKIE)
  if (fromCookie) {
    inMemoryAnonymousId = null
    return fromCookie
  }
  if (inMemoryAnonymousId) return inMemoryAnonymousId
  return persistAnonymousId(generateUuid())
}

/**
 * Forces a new anonymous_id. Used on logout — same person logging back in
 * later should not be linked to the previous logged-out user's events.
 */
export const resetAzionAnonymousId = () => persistAnonymousId(generateUuid())

export const getAzionUserId = () => getCookie(USER_ID_COOKIE)

/**
 * Persists the user id so the site can pick it up on the next visit and
 * automatically `identify(userId)`. Carries only the public id, no tokens.
 * Guards against oversized values so we stay under the 4 kB cookie limit.
 */
export const setAzionUserId = (userId) => {
  if (!userId) return
  try {
    const value = String(userId)
    if (value.length > MAX_USER_ID_LENGTH) {
      log('warn', 'user_id_too_large', { length: value.length })
      return
    }
    writeCookie(USER_ID_COOKIE, value, {
      maxAgeSeconds: ONE_YEAR_SECONDS,
      domain: getCookieDomain()
    })
  } catch (err) {
    log('error', 'set_user_id_failed', { msg: err?.message })
  }
}

export const clearAzionUserId = () => {
  try {
    writeCookie(USER_ID_COOKIE, '', {
      maxAgeSeconds: 0,
      domain: getCookieDomain()
    })
  } catch (err) {
    log('error', 'clear_user_id_failed', { msg: err?.message })
  }
}
