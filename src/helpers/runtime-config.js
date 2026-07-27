let _config = null

/**
 * Fetches /config.json and caches the result.
 * Must be called (and awaited) once, before Vue mounts — see src/main.js.
 *
 * When /config.json is absent (local dev, external forks) the cache falls
 * back to an empty object so every consumer gracefully degrades to its
 * build-time `import.meta.env.VITE_*` value.
 *
 * @returns {Promise<Record<string, string>>}
 */
export async function loadRuntimeConfig() {
  if (_config) return _config

  try {
    const response = await fetch('/config.json')
    _config = response.ok ? await response.json() : {}
  } catch {
    _config = {}
  }

  return _config
}

/**
 * Synchronous accessor for the cached runtime config.
 * Safe to call anywhere after loadRuntimeConfig() has resolved; before that
 * it returns an empty object (consumers then fall back to import.meta.env).
 *
 * @returns {Record<string, string>}
 */
export function getRuntimeConfig() {
  return _config || {}
}
