export const extractAffectedTableNames = (statements) => {
  const list = Array.isArray(statements) ? statements : [statements]
  const results = []
  for (const stmt of list) {
    if (typeof stmt !== 'string') continue
    // Collapse runs of whitespace to single spaces so the patterns below stay star-height 1
    // (no `\s+` quantifiers nested inside optional groups).
    const query = stmt.trim().replace(/\s+/g, ' ')
    let match
    match = query.match(/^alter table ["`]?([A-Za-z0-9_.-]+)["`]?/i)
    if (match && match[1]) {
      results.push({ action: 'alter', table: match[1] })
      continue
    }
    match = query.match(/^drop table (?:if exists )?["`]?([A-Za-z0-9_.-]+)["`]?/i)
    if (match && match[1]) {
      results.push({ action: 'drop', table: match[1] })
      continue
    }
    match = query.match(/^create table (?:if not exists )?["`]?([A-Za-z0-9_.-]+)["`]?/i)
    if (match && match[1]) {
      results.push({ action: 'create', table: match[1] })
      continue
    }
    match = query.match(/^rename table ["`]?([A-Za-z0-9_.-]+)["`]? to ["`]?([A-Za-z0-9_.-]+)["`]?/i)
    if (match && match[1]) {
      results.push({ action: 'rename', table: match[1] })
      if (match[2]) results.push({ action: 'create', table: match[2] })
      continue
    }
  }
  return results
}
