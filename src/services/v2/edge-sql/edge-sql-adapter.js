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

const formatSqlValue = (value, fieldName, schema) => {
  const column = schema.find((col) => col.name === fieldName)
  const columnType = column ? column.type.toUpperCase() : 'TEXT'

  if (value === null || String(value).toUpperCase() === 'NULL') {
    return 'NULL'
  }

  const numericTypes = ['INTEGER', 'REAL', 'NUMERIC']
  if (numericTypes.includes(columnType)) {
    const numericValue = Number(value)
    return isNaN(numericValue) ? 'NULL' : numericValue
  }

  const stringValue = String(value)
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
  return rows.map((row) => {
    const rowObject = {}
    columns.forEach((columnName, index) => {
      rowObject[columnName] = row[index]
    })
    return rowObject
  })
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

  adaptTableInfo({ data }) {
    const tableInfo = data[0]
    const tableData = data[1]

    const columns = tableInfo.results.rows.map((row) => ({
      columns: {
        name: row[1],
        type: row[2]
      }
    }))

    const rows = formatRowsForDisplay(tableData.results?.rows || [])
    const columnNames = columns.map((col) => col.columns.name)
    const mappedRows = mapRowsToObjects(columnNames, rows)

    return {
      columns,
      rows: mappedRows
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

  adaptQueryResult({ data }) {
    const processedResults = data.map((item) => ({
      columns: item.results?.columns || [],
      rows: formatRowsForDisplay(item.results?.rows || []),
      statement: item.results?.statement,
      queryDurationMs: item.results?.query_duration_ms,
      rowsRead: item.results?.rows_read,
      rowsWritten: item.results?.rows_written
    }))

    processedResults.forEach((result) => {
      result.rows = mapRowsToObjects(result.columns, result.rows)
    })

    return {
      state: data?.state || 'executed',
      results: processedResults,
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
    const buildSetClause = () => {
      return Object.keys(newData)
        .map((columnName) => {
          const formattedValue = formatSqlValue(newData[columnName], columnName, tableSchema)
          return `"${columnName}" = ${formattedValue}`
        })
        .join(', ')
    }

    const buildWhereClause = () => {
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

    const setClause = buildSetClause()
    const whereClause = buildWhereClause()
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
        return formatSqlValue(value, columnName, tableSchema)
      })
      .join(', ')

    const insertQuery = `INSERT INTO "${tableName}" (${columnsClause}) VALUES (${valuesClause});`

    return {
      statements: [insertQuery]
    }
  }
}
