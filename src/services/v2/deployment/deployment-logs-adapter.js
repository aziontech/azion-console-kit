const isObject = (value) => {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

const formatLogTime = (ts) => {
  if (!ts) return ''
  const date = new Date(ts)
  if (Number.isNaN(date.getTime())) return String(ts)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

const normalizeLevel = (level) => {
  const value = String(level ?? '').toLowerCase()
  if (value.includes('warn')) return 'warning'
  if (/err|fatal|critical/.test(value)) return 'error'
  return 'info'
}

export const DeploymentLogsAdapter = {
  transformList(events) {
    if (!Array.isArray(events)) return []
    return events.filter(isObject).map((event) => ({
      timestamp: formatLogTime(event.ts),
      content: event.phrase ?? '',
      level: normalizeLevel(event.level)
    }))
  }
}
