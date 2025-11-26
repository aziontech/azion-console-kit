export const extractAffectedTableNames = (statements) => {
  const list = Array.isArray(statements) ? statements : [statements]
  const results = []
  for (const stmt of list) {
    if (typeof stmt !== 'string') continue
    const query = stmt.trim()
    let match
    match = query.match(/^alter\s+table\s+["`]?([A-Za-z0-9_.-]+)["`]?/i)
    if (match && match[1]) {
      results.push({ action: 'alter', table: match[1] })
      continue
    }
    match = query.match(/^drop\s+table\s+(?:if\s+exists\s+)?["`]?([A-Za-z0-9_.-]+)["`]?/i)
    if (match && match[1]) {
      results.push({ action: 'drop', table: match[1] })
      continue
    }
    match = query.match(/^create\s+table\s+(?:if\s+not\s+exists\s+)?["`]?([A-Za-z0-9_.-]+)["`]?/i)
    if (match && match[1]) {
      results.push({ action: 'create', table: match[1] })
      continue
    }
    match = query.match(
      /^rename\s+table\s+["`]?([A-Za-z0-9_.-]+)["`]?\s+to\s+["`]?([A-Za-z0-9_.-]+)["`]?/i
    )
    if (match && match[1]) {
      results.push({ action: 'rename', table: match[1] })
      if (match[2]) results.push({ action: 'create', table: match[2] })
      continue
    }
  }
  return results
}
