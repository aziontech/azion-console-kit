import { formatExhibitionDate } from '@/helpers/convert-date'
import { parseStatusData } from '../utils/adapter/parse-status-utils'

const truncate = (str, len) => (str.length > len ? `${str.substring(0, len - 3)}...` : str)

const formatSqlValue = (value, fieldName, schema) => {
  const column = schema.find((column) => column.name === fieldName)
  const type = column ? column.type.toUpperCase() : 'TEXT'

  if (value === null || String(value).toUpperCase() === 'NULL') {
    return 'NULL'
  }

  if (['INTEGER', 'REAL', 'NUMERIC'].includes(type)) {
    const num = Number(value)
    return isNaN(num) ? 'NULL' : num
  }

  const stringValue = String(value)
  return `'${stringValue.replace(/'/g, "''")}'`
}

const formatters = {
  Array: (arr) => {
    if (arr.length <= 5) return `[${arr.join(', ')}]`
    return `Array[${arr.length}] [${arr.slice(0, 3).join(', ')}, ...]`
  },
  Blob: (blob) => `BLOB(${blob.byteLength || blob.length} bytes)`,
  Object: (obj) => {
    if (obj.type && obj.data) {
      return `${obj.type}(${obj.data.length || 'unknown size'})`
    }
    try {
      const jsonStr = JSON.stringify(obj)
      return truncate(jsonStr, 100)
    } catch {
      return `Object{${Object.keys(obj).length} keys}`
    }
  }
}

const formatCellValue = (value) => {
  const simpleValues = {
    null: 'NULL',
    undefined: 'UNDEFINED',
    '': '(empty)'
  }
  if (value in simpleValues) return simpleValues[value]
  if (value == null) return String(value).toUpperCase()

  if (Array.isArray(value)) return formatters.Array(value)
  if (value instanceof Uint8Array || value instanceof ArrayBuffer) return formatters.Blob(value)
  if (typeof value === 'object') return formatters.Object(value)
  return value
}

function mapRowsToObjects(columns, rows) {
  return rows.map((row) => {
    const obj = {}
    columns.forEach((column, index) => {
      obj[column] = row[index]
    })
    return obj
  })
}

const getStatusSeverity = (status) => {
  switch (status) {
    case 'created':
      return 'success'
    case 'creating':
      return 'info'
    case 'deletion_failed':
      return 'danger'
    case 'deleting':
      return 'warning'
    case 'unknown':
      return 'warning'
    case 'pending':
      return 'info'
    default:
      return 'info'
  }
}

export const EdgeSQLAdapter = {
  adaptDatabaseStatus(database) {
    return {
      id: database.id,
      name: database.name,
      clientId: database.client_id,
      status: database.status,
      createdAt: database.created_at || database.last_modified,
      updatedAt: database.updated_at || database.last_modified,
      lastModified: database.last_modified,
      deletedAt: database.deleted_at,
      isActive: database.active !== undefined ? database.active : database.is_active,
      productVersion: database.product_version,
      lastEditor: database.last_editor
    }
  },
  adaptDatabaseList(data) {
    const parsedDatabases = data.map((database) => {
      return {
        id: database.id,
        name: database.name,
        status: {
          content: database.status,
          severity: getStatusSeverity(database.status)
        },
        active: parseStatusData(database.active),
        last_modified: formatExhibitionDate(database.last_modified, 'full', undefined),
        lastModifyDate: database.last_modified
      }
    })

    return parsedDatabases
  },

  adaptDatabaseCreate(httpResponse) {
    const data = httpResponse.data || httpResponse.body
    const database = data.data || data
    return {
      id: database.id,
      name: database.name,
      status: database.status || 'creating',
      active: database.active
    }
  },

  adaptDatabase({ data }) {
    return {
      id: data.id,
      name: data.name,
      status: data.status,
      lastModified: data.last_modified,
      active: data.active
    }
  },
  adaptTables(data) {
    return data.results.map((table) => ({
      name: table.name,
      type: table.type || 'table',
      sql: table.sql
    }))
  },

  adaptTablesFromQuery({ data }) {
    if (!data[0].results.rows.length) return []
    return data[0].results.rows.map((row) => ({
      name: row[0],
      type: row[1] || 'table',
      sql: row[2] || ''
    }))
  },

  adaptTablesFromExecute({ data }) {
    return data[0].rows.map((row) => ({
      name: row[0],
      type: row[1] || 'table',
      sql: row[2] || ''
    }))
  },

  adaptQueryResult({ data }) {
    const formatRows = (rows) => rows.map((row) => row.map(formatCellValue))
    const results = data.map((item) => {
      return {
        columns: item.results?.columns || [],
        rows: formatRows(item.results?.rows) || [],
        statement: item.results?.statement,
        queryDurationMs: item.results?.query_duration_ms,
        rowsRead: item.results?.rows_read,
        rowsWritten: item.results?.rows_written
      }
    })

    results.forEach((result) => {
      result.rows = mapRowsToObjects(result.columns, result.rows)
    })

    return {
      state: data?.state || 'executed',
      results,
      affected: EdgeSQLAdapter.affectedRows({ data })
    }
  },

  adaptSqlCommands(sql) {
    if (!sql[0] || sql[0].trim() === '') {
      return []
    }

    const separator = /(?=\b(?:SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|WITH)\b)/i

    const formatSql = sql[0]
      .split(separator)
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0)

    return {
      statements: formatSql
    }
  },

  adaptQueryFromExecute({ data }) {
    const result = data[0]
    return {
      state: data?.state || 'executed',
      results: [
        {
          rows: result.rows || [],
          columns: result.columns || [],
          rowsAffected: result.rowsAffected || result.rows_affected || 0,
          executionTime: result.executionTime || result.execution_time || 0,
          success: true
        }
      ]
    }
  },

  adaptExecuteResult({ data }) {
    const results =
      data?.map((item) => {
        return {
          columns: item.results?.columns || [],
          rows: item.results?.rows || [],
          statement: item.results?.statement,
          queryDurationMs: item.results?.query_duration_ms,
          rowsRead: item.results?.rows_read,
          rowsWritten: item.results?.rows_written
        }
      }) || []

    return {
      state: data?.state || 'executed',
      results,
      affectedRows: EdgeSQLAdapter.affectedRows({ data })
    }
  },

  affectedRows({ data }) {
    return (
      data.reduce((total, result) => {
        return total + (result.rows?.length || 0)
      }, 0) || 0
    )
  },

  adaptUpdateRow({ tableName, newData, whereData, tableSchema }) {
    const setClause = Object.keys(newData)
      .map((key) => {
        const formattedValue = formatSqlValue(newData[key], key, tableSchema)
        return `"${key}" = ${formattedValue}`
      })
      .join(', ')

    const whereClause = Object.keys(whereData)
      .map((key) => {
        const originalValue = whereData[key]
        if (originalValue === null || String(originalValue).toUpperCase() === 'NULL') {
          return `"${key}" IS NULL`
        }
        const formattedValue = formatSqlValue(originalValue, key, tableSchema)
        return `"${key}" = ${formattedValue}`
      })
      .join(' AND ')

    const query = `UPDATE "${tableName}" SET ${setClause} WHERE ${whereClause};`

    return {
      statements: [query]
    }
  },

  adaptInsertRow({ tableName, dataToInsert, tableSchema }) {
    const columns = Object.keys(dataToInsert)

    const columnsPart = columns.map((col) => `"${col}"`).join(', ')

    const valuesPart = columns
      .map((col) => {
        const value = dataToInsert[col]
        return formatSqlValue(value, col, tableSchema)
      })
      .join(', ')

    return { statements: [`INSERT INTO "${tableName}" (${columnsPart}) VALUES (${valuesPart});`] }
  },

  adaptDatabaseDelete(httpResponse) {
    const data = httpResponse.data || httpResponse.body

    if (data?.state === 'pending') {
      return 'Database deletion initiated. This may take a few moments.'
    }

    return 'Database successfully deleted'
  }
}
