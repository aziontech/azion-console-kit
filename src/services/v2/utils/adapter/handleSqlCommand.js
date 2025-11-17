export const adaptSqlQuery = (sql) => {
  const sqlInput = Array.isArray(sql) ? sql.join('') : sql

  if (!sqlInput || sqlInput.trim() === '') {
    return { statements: [] }
  }

  const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'WITH']
  let statements = sqlInput.split(';')
  const processedStatements = []

  statements.forEach((statement) => {
    const trimmed = statement.trim()
    if (!trimmed) return

    const lines = trimmed.split('\n')
    let currentStatement = ''

    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      if (!trimmedLine) return

      const startsWithKeyword = sqlKeywords.some((keyword) => {
        const upperLine = trimmedLine.toUpperCase()
        const upperKeyword = keyword.toUpperCase()
        return upperLine === upperKeyword || upperLine.startsWith(upperKeyword + ' ')
      })

      if (startsWithKeyword && currentStatement.trim() && index > 0) {
        processedStatements.push(currentStatement.trim())
        currentStatement = trimmedLine
      } else {
        currentStatement += (currentStatement ? ' ' : '') + trimmedLine
      }
    })

    if (currentStatement.trim()) {
      processedStatements.push(currentStatement.trim())
    }
  })

  const finalStatements = processedStatements
    .filter((statement) => statement.length > 0)
    .map((statement) => (statement.endsWith(';') ? statement : statement + ';'))

  return finalStatements
}
