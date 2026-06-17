/* global globalThis */
/**
 * Deep-clone an object using the native structuredClone API when available,
 * falling back to JSON round-trip for older browsers.
 *
 * structuredClone handles Date, Map, Set and other non-JSON-safe types
 * correctly and is ~2x faster for typical objects.
 *
 * Note: structuredClone throws DataCloneError on values it can't serialize —
 * most notably Proxy objects, which is exactly what Vue's reactive()/ref()
 * wrap state in. Passing a reactive object straight to structuredClone (e.g.
 * cloning filterData.value for the share link) therefore throws. We catch that
 * and fall back to the JSON round-trip, which reads through the proxy and
 * produces a plain clone.
 *
 * @param {*} obj - The value to clone
 * @returns {*} A deep clone of the input
 */
export default function safeStructuredClone(obj) {
  if (typeof globalThis.structuredClone === 'function') {
    try {
      return globalThis.structuredClone(obj)
    } catch {
      /* DataCloneError (e.g. Vue reactive Proxy) — fall back to JSON below */
    }
  }
  return JSON.parse(JSON.stringify(obj))
}
