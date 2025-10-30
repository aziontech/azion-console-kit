import { TABLE_QUERIES } from './table-actions'

const getSchemaRows = (schema) => {
  if (!schema) return []
  if (Array.isArray(schema)) return schema
  if (Array.isArray(schema?.rows)) return schema.rows
  return []
}

const filterRowBySchema = (row, schema) => {
  const rows = getSchemaRows(schema)
  const columns = rows.map((column) => column.name)
  const filtered = {}
  for (const key of columns) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      filtered[key] = row[key]
    }
  }
  return filtered
}

export const onRowEditSave = async (updatedRowFn, databaseId, tableName, row, schema) => {
  const filteredRowData = filterRowBySchema(row, schema)
  await updatedRowFn(databaseId, {
    tableName,
    newData: filteredRowData,
    tableSchema: schema
  })
}

export const createDeleteService = (
  executeQuery,
  getTableName,
  getTableSchema,
  reloadFn,
  getDeleteType = 'row'
) => {
  return async (id, row) => {
    const tableName = typeof getTableName === 'function' ? getTableName() : getTableName
    const schema = typeof getTableSchema === 'function' ? getTableSchema() : getTableSchema
    if (!tableName || !row) return
    const deleteType = typeof getDeleteType === 'function' ? getDeleteType() : getDeleteType

    if (deleteType === 'column') {
      const columnName = row?.name
      if (!columnName) return
      const deleteColumnQuery = TABLE_QUERIES.DELETE_COLUMN(tableName, columnName)
      await executeQuery([deleteColumnQuery])
    } else {
      const filteredRowData = filterRowBySchema(row, schema)
      const deleteQuery = TABLE_QUERIES.DELETE_DATA(tableName, filteredRowData, schema)
      await executeQuery([deleteQuery])
    }

    if (typeof reloadFn === 'function') {
      await reloadFn()
    }
  }
}

export const createUpdateRowService = (
  updatedRowFn,
  getDatabaseId,
  getTableName,
  getTableSchema,
  reloadFn
) => {
  return async (newData, whereData) => {
    const databaseId = typeof getDatabaseId === 'function' ? getDatabaseId() : getDatabaseId
    const tableName = typeof getTableName === 'function' ? getTableName() : getTableName
    const schema = typeof getTableSchema === 'function' ? getTableSchema() : getTableSchema

    if (!databaseId || !tableName) return

    const filteredNewData = filterRowBySchema(newData || {}, schema)
    const filteredWhereData = filterRowBySchema(whereData || {}, schema)

    await updatedRowFn(databaseId, {
      tableName,
      newData: filteredNewData,
      whereData: filteredWhereData,
      tableSchema: schema
    })

    if (typeof reloadFn === 'function') {
      await reloadFn()
    }
  }
}

export const createInsertRowService = (
  insertRowFn,
  getDatabaseId,
  getTableName,
  getTableSchema,
  reloadFn
) => {
  return async (row) => {
    const databaseId = typeof getDatabaseId === 'function' ? getDatabaseId() : getDatabaseId
    const tableName = typeof getTableName === 'function' ? getTableName() : getTableName
    const schema = typeof getTableSchema === 'function' ? getTableSchema() : getTableSchema

    if (!databaseId || !tableName || !row) return

    const filteredData = filterRowBySchema(row, schema)

    await insertRowFn(databaseId, {
      tableName,
      dataToInsert: filteredData,
      tableSchema: schema
    })

    if (typeof reloadFn === 'function') {
      await reloadFn()
    }
  }
}
