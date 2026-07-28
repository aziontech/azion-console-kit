/**
 * Content-aware column sizing for the virtual table. `table-layout: fixed` needs
 * authoritative widths; this classifies each field by content shape and
 * distributes the MEASURED viewport width so WIDE fields absorb leftover space
 * over NARROW/MEDIUM. Pure functions; the Document column never competes here.
 */

/** Compact values: short enums/numbers — never need more than ~12 chars. */
const NARROW_FIELDS = new Set([
  'status',
  'upstreamStatus',
  'requestMethod',
  'scheme',
  'httpVersion',
  'requestTime',
  'upstreamResponseTime',
  'upstreamResponseTimeStr',
  'tcpinfoRtt',
  'bytesSent',
  'upstreamBytesSent',
  'upstreamBytesReceived',
  'requestLength',
  'remotePort',
  'serverPort',
  'proxyStatus',
  'level',
  'wafBlock',
  'wafLearning',
  'wafTotalBlocked',
  'wafTotalProcessed',
  'debugLog',
  'serverProtocol',
  'sslProtocol'
])

/** Value-heavy fields: URIs/UAs/hosts — get the leftover space preferentially. */
const WIDE_FIELDS = new Set([
  'requestUri',
  'httpReferer',
  'httpUserAgent',
  'host',
  'referer',
  'userAgent',
  'uri',
  'url',
  'requestQuery',
  'message',
  'title',
  'sentHttpContentType',
  'upstreamAddr',
  'sslCipher',
  'stacktrace'
])

/** Heuristic fallbacks for dataset fields not in the explicit sets. */
const NARROW_HINTS = /(status|method|scheme|port|bytes|length|version|level|block|time)$/i
const WIDE_HINTS =
  /(uri|url|referer|agent|host|message|path|query|body|detail|description|stacktrace)/i

export const COLUMN_CLASS_WIDTHS = {
  narrow: { base: 110, min: 90 },
  medium: { base: 180, min: 140 },
  wide: { base: 240, min: 240 }
}

/**
 * Classifies a field name into 'narrow' | 'medium' | 'wide'.
 * Explicit sets win; suffix/substring heuristics cover dataset-specific names;
 * everything else is 'medium' (the previous flat default band).
 *
 * @param {string} fieldName
 * @returns {'narrow'|'medium'|'wide'}
 */
export function classifyField(fieldName) {
  const name = String(fieldName || '')
  if (NARROW_FIELDS.has(name)) return 'narrow'
  if (WIDE_FIELDS.has(name)) return 'wide'
  if (NARROW_HINTS.test(name)) return 'narrow'
  if (WIDE_HINTS.test(name)) return 'wide'
  return 'medium'
}

/**
 * Distributes the available viewport width across the dynamic field columns:
 * user drag-widths are authoritative, NARROW/MEDIUM take their class base, WIDE
 * columns split the leftover equally (clamped to min → table h-scrolls). With no
 * WIDE columns the leftover tops up MEDIUM (capped).
 *
 * @param {Object} params
 * @param {number} params.availableWidth  measured viewport clientWidth (px)
 * @param {string[]} params.fields        selected field names, in column order
 * @param {Record<string, number>} [params.userWidths] drag-resized overrides
 * @param {number} params.fixedLeadWidth  chevron + time columns total (px)
 * @returns {Record<string, number>} fieldName -> width px
 */
export function distributeColumnWidths({
  availableWidth,
  fields,
  userWidths = {},
  fixedLeadWidth
}) {
  const widths = {}
  if (!Array.isArray(fields) || fields.length === 0) return widths

  const autoWide = []
  const autoMedium = []
  let consumed = fixedLeadWidth

  for (const field of fields) {
    const userWidth = userWidths[field]
    if (Number.isFinite(userWidth) && userWidth > 0) {
      widths[field] = userWidth
      consumed += userWidth
      continue
    }
    const klass = classifyField(field)
    const base = COLUMN_CLASS_WIDTHS[klass].base
    widths[field] = base
    consumed += base
    if (klass === 'wide') autoWide.push(field)
    else if (klass === 'medium') autoMedium.push(field)
  }

  const leftover = Math.floor((availableWidth || 0) - consumed)
  if (leftover <= 0) return widths

  if (autoWide.length > 0) {
    // Value-heavy fields absorb ALL the leftover, split equally. Assigning the
    // full remainder keeps Σwidths === availableWidth, so `table-layout: fixed`
    // does not re-distribute extra space back onto narrow columns.
    const share = Math.floor(leftover / autoWide.length)
    let remainder = leftover - share * autoWide.length
    for (const field of autoWide) {
      widths[field] += share + (remainder > 0 ? 1 : 0)
      if (remainder > 0) remainder -= 1
    }
    return widths
  }

  if (autoMedium.length > 0) {
    // No wide columns: top up mediums, but cap the bonus so a lone medium
    // column does not balloon across an ultrawide screen.
    const MEDIUM_TOPUP_CAP = 160
    const share = Math.min(Math.floor(leftover / autoMedium.length), MEDIUM_TOPUP_CAP)
    for (const field of autoMedium) widths[field] += share
  }

  return widths
}

/**
 * Minimum width for a field column (drag override wins, else class min).
 * Feeds the table's authoritative min-width so shrinking past it h-scrolls
 * instead of collapsing columns.
 *
 * @param {string} fieldName
 * @param {Record<string, number>} [userWidths]
 * @returns {number}
 */
export function minColumnWidth(fieldName, userWidths = {}) {
  const userWidth = userWidths[fieldName]
  if (Number.isFinite(userWidth) && userWidth > 0) return userWidth
  return COLUMN_CLASS_WIDTHS[classifyField(fieldName)].min
}
