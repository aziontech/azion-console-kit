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
    const keywords = [
      'select',
      'from',
      'where',
      'group by',
      'order by',
      'limit',
      'offset',
      'join',
      'left join',
      'right join',
      'inner join',
      'outer join',
      'on',
      'and',
      'or',
      'insert into',
      'values',
      'update',
      'set',
      'delete',
      'create',
      'alter',
      'drop'
    ]

    let out = text
      .replace(/\t+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\s*;\s*$/m, ';')
      .trim()

    for (const kw of keywords) {
      const re = new RegExp(`\\b${kw.replace(' ', '\\s+')}\\b`, 'gi')
      out = out.replace(re, (match) => `\n${match.toUpperCase()}`)
    }

    out = out
      .replace(/SELECT\s+/i, 'SELECT\n  ')
      .replace(/,\s*/g, ',\n  ')
      .replace(/\n\s*WHERE\s+/i, '\nWHERE\n  ')
      .replace(/\n\s*SET\s+/i, '\nSET\n  ')
      .replace(/\n\s*VALUES\s*\(/i, '\nVALUES (\n  ')
      .replace(/\)\s*;?$/, '\n);')

    return out
  }

  return { formatSql, lastError }
}
