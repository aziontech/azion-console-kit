/**
 * View protocol — the single `scheme:key` codec for the unified View selector.
 *
 * The View dropdown mixes two option families under one string encoding so a
 * consumer can route loading to the correct service:
 *
 *   events:<stackBy>      – 'events:none' | 'events:status' | 'events:requestMethod'
 *   metrics:<metricsKey>  – 'metrics:wafThreats' | 'metrics:botTraffic' | ...
 *
 * This lives in the RTE composables (a view concern already shared by
 * useChartConfig / useViewSync / useEventsExplorer) rather than in
 * `services/_shared` (design §2.1 contrato-espinha 8 / task 11.4). It is the
 * ONE place that knows the wire format; every parse and every encode routes
 * through {@link parseView} / {@link encodeView}.
 *
 * NOTE: this is unrelated to the `events:<uuid>` tab-identity namespace in
 * `useEventsTabs.js`, which is a different concern (tab ids, not view state).
 */

const SCHEMES = new Set(['events', 'metrics'])
const DEFAULT_VIEW = Object.freeze({ scheme: 'events', key: 'none' })

/**
 * Parse a unified View selection value into its `{ scheme, key }` intent.
 * Falls back to the default Events view for anything malformed or unknown.
 *
 * @param {string} viewValue
 * @returns {{ scheme: 'events'|'metrics', key: string }}
 */
export function parseView(viewValue) {
  if (typeof viewValue !== 'string' || !viewValue.includes(':')) {
    return { ...DEFAULT_VIEW }
  }
  const [scheme, ...rest] = viewValue.split(':')
  const key = rest.join(':')
  if (!SCHEMES.has(scheme)) {
    return { ...DEFAULT_VIEW }
  }
  return { scheme, key: key || 'none' }
}

/**
 * Encode a `{ scheme, key }` intent back into its `scheme:key` wire string.
 * Mirrors the historical inline literals verbatim: metrics keys pass through
 * as-is; events keys default to `'none'` when empty/falsy.
 *
 * @param {{ scheme: 'events'|'metrics', key?: string }} intent
 * @returns {string}
 */
export function encodeView({ scheme, key } = {}) {
  return scheme === 'metrics' ? `metrics:${key}` : `events:${key || 'none'}`
}
