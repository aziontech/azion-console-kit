import { formatExhibitionDate } from '@/helpers/convert-date'
import { parseStatusData } from '../utils/adapter/parse-status-utils'
import { adaptSqlQuery } from '../utils/adapter/handleSqlCommand'

const truncateString = (str, maxLength) => {
  return str.length > maxLength ? `${str.substring(0, maxLength - 3)}...` : str
}

const getDatabaseStatusSeverity = (status) => {
  const statusMap = {
    created: 'success',
    creating: 'info',
    deletion_failed: 'danger',
    deleting: 'warning',
    unknown: 'warning',
    pending: 'info'
  }
  return statusMap[status] || 'info'
}

const buildSetClause = (newData, tableSchema) => {
  return Object.keys(newData)
    .map((columnName) => {
      const formattedValue = formatSqlValue(newData[columnName], columnName, tableSchema)
      return `"${columnName}" = ${formattedValue}`
    })
    .join(', ')
}

const buildWhereClause = (whereData, tableSchema) => {
  const hasIdColumn = Array.isArray(tableSchema)
    ? tableSchema.some((col) => col?.name === 'id' || col?.name === 'ID')
    : false

  if (hasIdColumn && (whereData?.id !== undefined || whereData?.ID !== undefined)) {
    const key = whereData.id !== undefined ? 'id' : 'ID'
    const originalValue = whereData[key]
    const normalizedValue = typeof originalValue === 'string' ? originalValue.trim() : originalValue
    if (normalizedValue === null || String(normalizedValue).toUpperCase() === 'NULL') {
      return `"${key}" IS NULL`
    }
    const formattedValue = formatSqlValue(normalizedValue, key, tableSchema)
    return `"${key}" = ${formattedValue}`
  }

  return Object.keys(whereData)
    .map((columnName) => {
      const originalValue = whereData[columnName]

      if (originalValue === null || String(originalValue).toUpperCase() === 'NULL') {
        return `"${columnName}" IS NULL`
      }

      const formattedValue = formatSqlValue(originalValue, columnName, tableSchema)
      return `"${columnName}" = ${formattedValue}`
    })
    .join(' AND ')
}

const formatSqlValue = (value, fieldName, schema) => {
  const column = schema.find((col) => col.name === fieldName)
  const columnType = column ? column.type.toUpperCase() : 'TEXT'

  if (value === null || String(value).toUpperCase() === 'NULL') {
    return 'NULL'
  }

  const numericTypes = ['INTEGER', 'REAL', 'NUMERIC']
  if (numericTypes.includes(columnType)) {
    const source = typeof value === 'string' ? value.trim() : value
    const numericValue = Number(source)
    return isNaN(numericValue) ? 'NULL' : numericValue
  }

  const stringValue = typeof value === 'string' ? value.trim() : String(value)
  return `'${stringValue.replace(/'/g, "''")}'`
}

const cellValueFormatters = {
  formatArray: (array) => {
    if (array.length <= 5) {
      return `[${array.join(', ')}]`
    }
    return `Array[${array.length}] [${array.slice(0, 3).join(', ')}, ...]`
  },

  formatBlob: (blob) => {
    const size = blob.byteLength || blob.length
    return `BLOB(${size} bytes)`
  },

  formatObject: (obj) => {
    if (obj.type && obj.data) {
      return `${obj.type}(${obj.data.length || 'unknown size'})`
    }
    try {
      const jsonString = JSON.stringify(obj)
      return truncateString(jsonString, 100)
    } catch {
      return `Object{${Object.keys(obj).length} keys}`
    }
  }
}

const formatRowsForDisplay = (rows) => {
  return rows.map((row) => row.map(formatCellValue))
}

const formatCellValue = (value) => {
  const nullValues = {
    null: 'NULL',
    undefined: 'UNDEFINED',
    '': '(empty)'
  }

  if (value in nullValues) return nullValues[value]
  if (value == null) return String(value).toUpperCase()

  if (Array.isArray(value)) return cellValueFormatters.formatArray(value)
  if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
    return cellValueFormatters.formatBlob(value)
  }
  if (typeof value === 'object') return cellValueFormatters.formatObject(value)

  return value
}

const mapRowsToObjects = (columns, rows) => {
  const hasIdColumn = Array.isArray(columns)
    ? columns.some((name) => String(name).toLowerCase() === 'id')
    : false

  return rows.map((row, rowIndex) => {
    const rowObject = {}
    columns.forEach((columnName, colIndex) => {
      rowObject[columnName] = row[colIndex]
    })
    if (!hasIdColumn) {
      rowObject.index = rowIndex + 1
    }
    return rowObject
  })
}

const formatDefaultClause = (value, colType) => {
  if (value === undefined || value === null) return ''

  const colTypeUpper = String(colType || '').toUpperCase()

  const isSqlKeywordDefault = typeof value === 'string' && /^CURRENT_|^NOW\(\)$/.test(value)
  if (isSqlKeywordDefault) return `DEFAULT ${value}`

  const numericTypes = ['INTEGER', 'INT', 'REAL', 'NUMERIC', 'DECIMAL', 'FLOAT', 'DOUBLE']
  const booleanTypes = ['BOOLEAN', 'BOOL', 'TINYINT(1)']

  if (numericTypes.includes(colTypeUpper)) {
    const num = Number(value)
    return isNaN(num) ? `DEFAULT '${String(value).replace(/'/g, "''")}'` : `DEFAULT ${num}`
  }

  if (booleanTypes.includes(colTypeUpper) || colTypeUpper.includes('BOOL')) {
    const boolNum =
      value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true'
        ? 1
        : 0
    return `DEFAULT ${boolNum}`
  }

  // Text-like: quote and escape
  const stringVal = String(value).replace(/'/g, "''")
  return `DEFAULT '${stringVal}'`
}

export const EdgeSQLAdapter = {
  adaptDatabaseStatus({ data }) {
    return {
      id: data.id,
      name: data.name,
      status: data.status
    }
  },

  adaptDatabaseList(databases) {
    return databases.map((database) => ({
      id: database.id,
      name: database.name,
      status: {
        content: database.status,
        severity: getDatabaseStatusSeverity(database.status)
      },
      active: parseStatusData(database.active),
      lastEditor: database.last_editor,
      lastModified: formatExhibitionDate(database.last_modified, 'full', undefined),
      lastModifyDate: database.last_modified
    }))
  },

  adaptDatabaseCreate(httpResponse) {
    const responseData = httpResponse.data || httpResponse.body
    const database = responseData.data || responseData

    return {
      id: database.id,
      name: database.name,
      status: database.status || 'creating',
      active: database.active
    }
  },

  adaptDatabaseCreatePayload(payload) {
    return {
      name: payload.name
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

  adaptDatabaseDelete(httpResponse) {
    const responseData = httpResponse.data || httpResponse.body

    if (responseData?.state === 'pending') {
      return 'Database deletion initiated. This may take a few moments.'
    }

    return 'Database successfully deleted'
  },
  adaptTables(data) {
    return data.results.map((table) => ({
      name: table.name,
      type: table.type || 'table',
      sql: table.sql
    }))
  },

  adaptTablesFromQuery({ data }) {
    const queryResult = data[0]
    if (!queryResult?.results?.rows?.length) return []

    return queryResult.results.rows.map((row) => ({
      name: row[0],
      type: row[1] || 'table',
      sql: row[2] || ''
    }))
  },

  adaptTableInfo({ data }, tableSchema) {
    const tableInfo = data[0]
    const rows = formatRowsForDisplay(tableInfo.results?.rows || [])
    const columnNames = tableSchema.map((col) => col.name)
    const mappedRows = mapRowsToObjects(columnNames, rows)

    return {
      rows: mappedRows,
      tableSchema
    }
  },

  adaptTableSchemaFromPragmaRows(rows) {
    const safeRows = Array.isArray(rows) ? rows : []
    return safeRows.map((row, index) => ({
      id: index,
      name: row?.[1],
      type: row?.[2],
      notNull: row?.[3],
      default: row?.[4],
      primaryKey: row?.[5]
    }))
  },

  adaptInsertColumn({ tableName, columnData }) {
    const { name, type, default: defaultValue, notNull } = columnData || {}

    const safeName = String(name ?? '').trim()
    const safeType = type ? String(type).trim() : ''
    if (!safeName) throw new Error('Column name is required')

    const parts = []
    parts.push(`"${safeName}"`)
    if (safeType) parts.push(safeType)
    if (notNull) parts.push('NOT NULL')

    const defaultClause = formatDefaultClause(defaultValue, type)
    if (defaultClause) parts.push(defaultClause)

    const query = `ALTER TABLE "${tableName}" ADD COLUMN ${parts.join(' ')};`

    return {
      statements: [query]
    }
  },

  adaptUpdateColumn({ tableName, columnData, oldColumnData }) {
    const { name, type, default: defaultValue, notNull } = columnData || {}
    const rawOldName = oldColumnData?.name || columnData?.oldName || name

    const safeNewName = String(name ?? '').trim()
    const safeOldName = String(rawOldName ?? '').trim()
    const safeType = type ? String(type).trim() : ''
    if (!safeNewName) throw new Error('Column name is required')

    const constraintParts = []
    if (notNull) constraintParts.push('NOT NULL')
    const defaultClause = formatDefaultClause(defaultValue, safeType)
    if (defaultClause) constraintParts.push(defaultClause)

    const typePart = safeType ? ` ${safeType}` : ''
    const constraintsPart = constraintParts.length ? ` ${constraintParts.join(' ')}` : ''

    const query = `ALTER TABLE \`${tableName}\` \nCHANGE COLUMN \`${safeOldName}\`  \`${safeNewName}\`${typePart}${constraintsPart};`

    return {
      statements: [query]
    }
  },

  adaptTablesFromExecute({ data }) {
    const executeResult = data[0]
    if (!executeResult?.rows?.length) return []

    return executeResult.rows.map((row) => ({
      name: row[0],
      type: row[1] || 'table',
      sql: row[2] || ''
    }))
  },

  adaptSqlCommands(sql) {
    const processedStatements = adaptSqlQuery(sql)
    return {
      statements: processedStatements
    }
  },

  buildTableInfoStatements(tableName, needSchema) {
    if (needSchema) {
      return [`PRAGMA table_info(${tableName});`, `SELECT * FROM ${tableName}`]
    }
    return [`SELECT * FROM ${tableName}`]
  },

  adaptQueryResult({ data }, isCountSelect) {
    const processedResults = data.map((item) => ({
      columns: item.results?.columns || [],
      rows: formatRowsForDisplay(item.results?.rows || []),
      statement: item.results?.statement,
      queryDurationMs: item.results?.query_duration_ms,
      rowsRead: item.results?.rows_read,
      rowsWritten: item.results?.rows_written
    }))

    processedResults.forEach((result) => {
      const columnNames = Array.isArray(result.columns)
        ? result.columns.map((col) => (typeof col === 'string' ? col : col?.name))
        : []
      result.rows = mapRowsToObjects(columnNames, result.rows)
    })

    const prioritizedResults = this.prioritizeSelectResults(processedResults)

    if (isCountSelect) {
      if (prioritizedResults.length === 1) {
        prioritizedResults.push({
          columns: ['name', 'type'],
          rows: [{ name: 'COUNT(*)', type: 'INTEGER' }],
          statement: '-- synthetic: COUNT column schema',
          queryDurationMs: 0,
          rowsRead: 0,
          rowsWritten: 0
        })
      }
    }

    return {
      state: data?.state || 'executed',
      results: prioritizedResults,
      affected: this.calculateAffectedRows({ data })
    }
  },

  adaptExecuteResult({ data }) {
    const processedResults =
      data?.map((item) => ({
        columns: item.results?.columns || [],
        rows: item.results?.rows || [],
        statement: item.results?.statement,
        queryDurationMs: item.results?.query_duration_ms,
        rowsRead: item.results?.rows_read,
        rowsWritten: item.results?.rows_written
      })) || []

    // For COUNT-only queries, append a synthetic schema result for the view

    const prioritizedResults = this.prioritizeSelectResults(processedResults)

    return {
      state: data?.state || 'executed',
      results: prioritizedResults,
      affectedRows: this.calculateAffectedRows({ data })
    }
  },

  adaptQueryFromExecute({ data }) {
    const firstResult = data[0]

    return {
      state: data?.state || 'executed',
      results: [
        {
          rows: firstResult.rows || [],
          columns: firstResult.columns || [],
          rowsAffected: firstResult.rowsAffected || firstResult.rows_affected || 0,
          executionTime: firstResult.executionTime || firstResult.execution_time || 0,
          success: true
        }
      ]
    }
  },

  prioritizeSelectResults(results) {
    if (!Array.isArray(results) || results.length <= 1) {
      return results
    }

    const selectQueries = []
    const otherQueries = []

    results.forEach((result) => {
      const hasReadData = result.rowsRead > 0 && result.rows?.length > 0

      if (hasReadData) {
        selectQueries.push(result)
      } else {
        otherQueries.push(result)
      }
    })

    return [...selectQueries, ...otherQueries]
  },

  calculateAffectedRows({ data }) {
    return data.reduce((total, result) => {
      return total + (result.rows?.length || 0)
    }, 0)
  },

  adaptUpdateRow({ tableName, newData, whereData, tableSchema }) {
    const setClause = buildSetClause(newData, tableSchema)
    const whereClause = buildWhereClause(whereData, tableSchema)
    const updateQuery = `UPDATE "${tableName}" SET ${setClause} WHERE ${whereClause};`

    return {
      statements: [updateQuery]
    }
  },

  adaptInsertRow({ tableName, dataToInsert, tableSchema }) {
    const columnNames = Object.keys(dataToInsert)

    const columnsClause = columnNames.map((columnName) => `"${columnName}"`).join(', ')

    const valuesClause = columnNames
      .map((columnName) => {
        const value = dataToInsert[columnName]
        const normalizedValue = typeof value === 'string' ? value.trim() : value
        return formatSqlValue(normalizedValue, columnName, tableSchema)
      })
      .join(', ')

    const insertQuery = `INSERT INTO "${tableName}" (${columnsClause}) VALUES (${valuesClause});`

    return {
      statements: [insertQuery]
    }
  }
}
