/**
 * Deep-clone an object using the native structuredClone API when available,
 * falling back to JSON round-trip for older browsers.
 *
 * structuredClone handles Date, Map, Set and other non-JSON-safe types
 * correctly and is ~2x faster for typical objects.
 *
 * @param {*} obj - The value to clone
 * @returns {*} A deep clone of the input
 */
export default function safeStructuredClone(obj) {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(obj)
  }
  return JSON.parse(JSON.stringify(obj))
}
