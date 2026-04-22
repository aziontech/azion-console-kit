/**
 * Severity classification for log field values.
 * Maps field names to classifier functions that return 'error', 'warn', or null.
 */

function classifyHttpStatus(val) {
  const num = Number(val)
  if (isNaN(num)) return null
  if (num >= 500) return 'error'
  if (num >= 400) return 'warn'
  return null
}

function classifyLogLevel(val) {
  const lower = String(val).toLowerCase()
  if (['error', 'err', 'fatal', 'crit'].includes(lower)) return 'error'
  if (['warn', 'warning'].includes(lower)) return 'warn'
  return null
}

const SEVERITY_FIELDS = {
  status: classifyHttpStatus,
  statusCode: classifyHttpStatus,
  upstreamStatus: classifyHttpStatus,
  level: classifyLogLevel,
  wafBlock: (val) => (String(val) === '1' ? 'error' : null),
  referenceError: (val) => (val && val !== '-' ? 'error' : null)
}

export function getSeverity(fieldKey, fieldValue) {
  const classifier = SEVERITY_FIELDS[fieldKey]
  return classifier ? classifier(fieldValue) : null
}
