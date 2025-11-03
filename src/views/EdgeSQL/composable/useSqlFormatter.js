import { ref } from 'vue'

export function useSqlFormatter() {
  const lastError = ref(null)

  const formatSql = (text) => {
    lastError.value = null
    const input = (text || '').toString()
    if (!input.trim()) return ''

    try {
      return simpleSqlFormat(input)
    } catch (err) {
      lastError.value = err
      return input
    }
  }

  const simpleSqlFormat = (text) => {
    const input = text.replace(/\r\n?/g, '\n')
    const segments = splitSqlPreservingLiterals(input)
    const formatted = segments
      .map((seg) => (seg.type === 'code' ? formatCode(seg.text) : seg.text))
      .join('')
    return formatted.replace(/\s+;\s*$/m, ';').replace(/\s+$/m, '')
  }

  const splitSqlPreservingLiterals = (text) => {
    const out = []
    let buf = ''
    let cursor = 0
    let state = 'code'
    while (cursor < text.length) {
      const ch = text[cursor]
      const nxt = text[cursor + 1]
      if (state === 'code') {
        if (ch === "'") {
          if (buf) {
            out.push({ type: 'code', text: buf })
            buf = ''
          }
          state = 'sq'
          buf += ch
          cursor++
          continue
        }
        if (ch === '"') {
          if (buf) {
            out.push({ type: 'code', text: buf })
            buf = ''
          }
          state = 'dq'
          buf += ch
          cursor++
          continue
        }
        if (ch === '`') {
          if (buf) {
            out.push({ type: 'code', text: buf })
            buf = ''
          }
          state = 'bt'
          buf += ch
          cursor++
          continue
        }
        if (ch === '[') {
          if (buf) {
            out.push({ type: 'code', text: buf })
            buf = ''
          }
          state = 'br'
          buf += ch
          cursor++
          continue
        }
        if (ch === '-' && nxt === '-') {
          if (buf) {
            out.push({ type: 'code', text: buf })
            buf = ''
          }
          state = 'lc'
          buf += ch + nxt
          cursor += 2
          continue
        }
        if (ch === '/' && nxt === '*') {
          if (buf) {
            out.push({ type: 'code', text: buf })
            buf = ''
          }
          state = 'bc'
          buf += ch + nxt
          cursor += 2
          continue
        }
        buf += ch
        cursor++
        continue
      }
      if (state === 'sq') {
        buf += ch
        cursor++
        if (ch === "'" && text[cursor] === "'") {
          buf += text[cursor]
          cursor++
          continue
        }
        if (ch === "'") {
          out.push({ type: 'str', text: buf })
          buf = ''
          state = 'code'
        }
        continue
      }
      if (state === 'dq') {
        buf += ch
        cursor++
        if (ch === '"') {
          out.push({ type: 'str', text: buf })
          buf = ''
          state = 'code'
        }
        continue
      }
      if (state === 'bt') {
        buf += ch
        cursor++
        if (ch === '`') {
          out.push({ type: 'str', text: buf })
          buf = ''
          state = 'code'
        }
        continue
      }
      if (state === 'br') {
        buf += ch
        cursor++
        if (ch === ']') {
          out.push({ type: 'str', text: buf })
          buf = ''
          state = 'code'
        }
        continue
      }
      if (state === 'lc') {
        buf += ch
        cursor++
        if (ch === '\n') {
          out.push({ type: 'comment', text: buf })
          buf = ''
          state = 'code'
        }
        continue
      }
      if (state === 'bc') {
        buf += ch
        cursor++
        if (ch === '*' && text[cursor] === '/') {
          buf += '/'
          cursor++
          out.push({ type: 'comment', text: buf })
          buf = ''
          state = 'code'
        }
        continue
      }
    }
    if (buf)
      out.push({
        type: state === 'code' ? 'code' : state === 'lc' || state === 'bc' ? 'comment' : 'str',
        text: buf
      })
    return out
  }

  const formatCode = (code) => {
    let sqlCode = code.replace(/\t+/g, ' ').replace(/\s+/g, ' ').trim()
    sqlCode = applyClauseBreaks(sqlCode)
    sqlCode = formatSelectSection(sqlCode)
    sqlCode = formatCreateTableSection(sqlCode)
    sqlCode = formatInsertSections(sqlCode)
    sqlCode = formatUpdateSetSection(sqlCode)
    return sqlCode
  }

  const applyClauseBreaks = (sqlCode) => {
    const clauses = [
      'WITH',
      'SELECT',
      'INSERT INTO',
      'UPDATE',
      'DELETE FROM',
      'CREATE TABLE',
      'ALTER TABLE',
      'DROP TABLE',
      'FROM',
      'LEFT JOIN',
      'RIGHT JOIN',
      'INNER JOIN',
      'OUTER JOIN',
      'JOIN',
      'ON',
      'WHERE',
      'GROUP BY',
      'HAVING',
      'ORDER BY',
      'LIMIT',
      'OFFSET',
      'RETURNING',
      'VALUES'
    ]
    clauses.sort((left, right) => right.length - left.length)
    for (const kw of clauses) {
      const re = new RegExp(`\\b${kw.replace(/\s+/g, '\\s+')}\\b`, 'gi')
      sqlCode = sqlCode.replace(re, (match) => `\n${match}`)
    }
    sqlCode = sqlCode.replace(/\s*;\s*$/m, ';')
    sqlCode = sqlCode.replace(/\n{2,}/g, '\n')
    return sqlCode.trim()
  }

  const formatSelectSection = (sqlCode) => {
    const re = /\bSELECT\b([\s\S]*?)\bFROM\b/i
    return sqlCode.replace(re, (match, list) => {
      const cleaned = list.trim().replace(/\s*,\s*/g, ', ')
      const pretty = cleaned
        .split(', ')
        .map((columnExpression) => columnExpression.trim())
        .filter(Boolean)
        .join(',\n  ')
      return `SELECT\n  ${pretty}\nFROM`
    })
  }

  const formatCreateTableSection = (sqlCode) => {
    const re = /\bCREATE\s+TABLE\b\s+([\w"`[\].]+)\s*\(([^)]*)\)/gi
    return sqlCode.replace(re, (match, name, cols) => {
      const inner = cols
        .trim()
        .replace(/\s*,\s*/g, ', ')
        .split(', ')
        .map((column) => column.trim())
        .filter(Boolean)
        .join(',\n  ')
      return `CREATE TABLE ${name} (\n  ${inner}\n)`
    })
  }

  const formatInsertSections = (sqlCode) => {
    sqlCode = sqlCode.replace(
      /\bINSERT\s+INTO\b\s+([\w"`[\].]+)\s*\(([^)]*)\)/gi,
      (match, name, cols) => {
        const inner = cols
          .trim()
          .replace(/\s*,\s*/g, ', ')
          .split(', ')
          .map((column) => column.trim())
          .join(',\n  ')
        return `INSERT INTO ${name} (\n  ${inner}\n)`
      }
    )
    sqlCode = sqlCode.replace(/\bVALUES\b\s*\(([^)]*)\)/gi, (match, vals) => {
      const inner = vals
        .trim()
        .replace(/\s*,\s*/g, ', ')
        .split(', ')
        .map((value) => value.trim())
        .join(',\n  ')
      return `VALUES (\n  ${inner}\n)`
    })
    return sqlCode
  }

  const formatUpdateSetSection = (sqlCode) => {
    const re = /\bSET\b\s+([^;\n]+)/gi
    return sqlCode.replace(re, (match, assigns) => {
      const inner = assigns
        .trim()
        .replace(/\s*,\s*/g, ', ')
        .split(', ')
        .map((assign) => assign.trim())
        .join(',\n  ')
      return `SET\n  ${inner}`
    })
  }

  return { formatSql, lastError }
}
