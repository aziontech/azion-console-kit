import { getCurrentTimezone } from './account-timezone'

/**
 * Field ordering for the Document column in Real-Time Events. Fields listed
 * here render first, in this exact order; anything else falls after in
 * alphabetical order. Keeps the most diagnostically valuable attributes
 * (host, status, request info, WAF decisions, etc.) visible at a glance.
 */
const SUMMARY_FIELD_PRIORITY = [
  'configurationId',
  'host',
  'requestUri',
  'requestMethod',
  'status',
  'httpReferer',
  'httpUserAgent',
  'remoteAddress',
  'requestId',
  'requestTime',
  'scheme',
  'serverAddr',
  'serverPort',
  'serverProtocol',
  'sslCipher',
  'sslProtocol',
  'upstreamBytesSent',
  'upstreamCacheStatus',
  'wafEvheaders',
  'wafLearning',
  'wafMatch'
]
const SUMMARY_FIELD_PRIORITY_INDEX = new Map(
  SUMMARY_FIELD_PRIORITY.map((key, index) => [key, index])
)

const formatEscapedJson = (value) => {
  try {
    let cleaned = value
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1)
    }
    cleaned = cleaned.replace(/\\"/g, '"')
    const parsed = JSON.parse(cleaned)
    return JSON.stringify(parsed, null, 2)
  } catch (error) {
    return value
  }
}

export const buildSummary = (
  httpResponse,
  shouldLimitRequestUri = false,
  shouldShowTs = false,
  includeMissingPriorityFields = false
) => {
  // Task 15.2: the `shouldLimitRequestUri` flag is retained for signature/
  // back-compat but MUST NOT truncate the stored value anymore. Truncating at
  // data level cut the real requestUri (e.g. `<first 50 chars>...`), so copy /
  // add-filter / exclude-filter emitted a value that diverged from the applied
  // filter. The full value is now preserved end-to-end; visual shortening is
  // CSS-only (ellipsis) plus a tooltip/title that exposes the complete URI.
  void shouldLimitRequestUri

  const formatEntry = (key, value) => {
    if (key === 'stacktrace' || key === 'requestData') {
      return { key, value: value ? formatEscapedJson(value) : '-' }
    }
    if (key === 'requestUri') {
      return { key, value: value !== null && value !== undefined && value !== '' ? value : '-' }
    }
    if (key === 'ts') {
      return { key, value: value ? getCurrentTimezone(value) : '-' }
    }
    return { key, value: value !== null && value !== undefined && value !== '' ? value : '-' }
  }

  // Present keys first, then reserve slots for priority fields that the
  // response didn't include (emit them as '-'). This keeps the first N
  // badges visually consistent across rows of different event shapes —
  // row 1 (full HTTP) and row 3 (WAF-heavy, missing host/status) both
  // show the same priority slots in the same order.
  const presentKeys = new Set(Object.keys(httpResponse))
  const syntheticPriorityEntries = includeMissingPriorityFields
    ? SUMMARY_FIELD_PRIORITY.filter((key) => !presentKeys.has(key))
        .filter((key) => (shouldShowTs ? true : key !== 'ts'))
        .map((key) => [key, null])
    : []

  return [...Object.entries(httpResponse), ...syntheticPriorityEntries]
    .filter(([key]) => (shouldShowTs ? true : key !== 'ts'))
    .sort(([currentKey], [nextKey]) => {
      // Priority fields come first in their declared order; everything else
      // falls through to alphabetical ordering.
      const currentPriority = SUMMARY_FIELD_PRIORITY_INDEX.has(currentKey)
        ? SUMMARY_FIELD_PRIORITY_INDEX.get(currentKey)
        : Number.POSITIVE_INFINITY
      const nextPriority = SUMMARY_FIELD_PRIORITY_INDEX.has(nextKey)
        ? SUMMARY_FIELD_PRIORITY_INDEX.get(nextKey)
        : Number.POSITIVE_INFINITY
      if (currentPriority !== nextPriority) return currentPriority - nextPriority
      return currentKey.localeCompare(nextKey)
    })
    .map(([key, value]) => formatEntry(key, value))
}
