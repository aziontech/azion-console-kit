export class EdgeSQLAdapter {
  static adaptDatabaseStatus(httpResponse) {
    const data = httpResponse.data || httpResponse.body
    const database = data.data || data

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
  }

  static adaptDatabaseList(httpResponse) {
    const data = httpResponse.data || httpResponse.body
    if (!data || !Array.isArray(data.results)) {
      return {
        count: 0,
        body: []
      }
    }

    const parsedDatabases = data.results
      .map((database) => {
        if (!database || typeof database !== 'object') {
          return null
        }

        return {
          id: String(database.id || ''),
          name: {
            text: database.name || '',
            tagProps: {}
          },
          clientId: database.client_id,
          status: {
            content: String(database.status || 'unknown'),
            severity: EdgeSQLAdapter.getStatusSeverity(database.status)
          },
          created_at: EdgeSQLAdapter.formatDate(database.created_at || database.last_modified),
          last_modified: EdgeSQLAdapter.formatDate(database.last_modified),
          lastModifyDate: String(database.last_modified || '')
        }
      })
      .filter(Boolean)

    return {
      count: parseInt(data.count || 0),
      body: parsedDatabases
    }
  }

  static adaptDatabaseCreate(httpResponse) {
    const data = httpResponse.data || httpResponse.body
    const database = data.data || data
    return {
      id: database.id,
      name: database.name,
      clientId: database.client_id,
      status: database.status || 'creating',
      createdAt: database.created_at || database.last_modified,
      updatedAt: database.updated_at || database.last_modified,
      lastModified: database.last_modified,
      isActive: database.active !== undefined ? database.active : database.is_active,
      productVersion: database.product_version,
      lastEditor: database.last_editor
    }
  }

  static adaptDatabase(httpResponse) {
    const data = httpResponse.data || httpResponse.body
    const database = data.data || data
    return {
      statusCode: 200,
      body: {
        id: database.id,
        name: database.name,
        clientId: database.client_id,
        status: database.status,
        createdAt: database.created_at || database.last_modified,
        updatedAt: database.updated_at || database.last_modified,
        lastModified: database.last_modified,
        isActive: database.active !== undefined ? database.active : database.is_active,
        productVersion: database.product_version,
        lastEditor: database.last_editor
      }
    }
  }

  static adaptTables(httpResponse) {
    const data = httpResponse.data || httpResponse.body
    if (!data || !Array.isArray(data.results)) {
      return []
    }

    return data.results.map((table) => ({
      name: table.name,
      type: table.type || 'table',
      sql: table.sql
    }))
  }

  static adaptTablesFromQuery(httpResponse) {
    const data = httpResponse.data || httpResponse.body

    if (!data?.data || !Array.isArray(data.data) || data.data.length === 0) {
      return {
        statusCode: 200,
        body: {
          tables: []
        }
      }
    }

    const firstResult = data.data[0]
    if (firstResult.error || !firstResult.results?.rows) {
      return {
        statusCode: 200,
        body: {
          tables: []
        }
      }
    }

    // SQLite master table returns: name, type, sql
    const tables = firstResult.results.rows.map((row) => ({
      name: row[0], // name column
      type: row[1] || 'table', // type column
      sql: row[2] || '' // sql column
    }))

    return {
      statusCode: 200,
      body: {
        tables: tables
      }
    }
  }

  static adaptTablesFromExecute(httpResponse) {
    const data = httpResponse.data || httpResponse.body
    const results = data.data || data

    // Execute returns array of results, get first one
    if (!Array.isArray(results) || results.length === 0) {
      return {
        statusCode: 200,
        body: {
          tables: []
        }
      }
    }

    const result = results[0]
    if (!result.rows || !Array.isArray(result.rows)) {
      return {
        statusCode: 200,
        body: {
          tables: []
        }
      }
    }

    // SQLite master table returns: name, type, sql
    const tables = result.rows.map((row) => ({
      name: row[0], // name column
      type: row[1] || 'table', // type column
      sql: row[2] || '' // sql column
    }))

    return {
      statusCode: 200,
      body: {
        tables: tables
      }
    }
  }

  static adaptQueryResult(httpResponse) {
    const data = httpResponse.data || httpResponse.body

    // A API retorna data como array de objetos com results ou error
    const results =
      data?.data?.map((item) => {
        // Se há erro no item, retornar estrutura de erro
        if (item.error) {
          return {
            error: item.error,
            columns: [],
            rows: [],
            statement: null,
            query_duration_ms: null,
            rows_read: null,
            rows_written: null
          }
        }

        // Se há results, processar normalmente
        return {
          columns: item.results?.columns || [],
          rows: item.results?.rows || [],
          statement: item.results?.statement,
          query_duration_ms: item.results?.query_duration_ms,
          rows_read: item.results?.rows_read,
          rows_written: item.results?.rows_written
        }
      }) || []

    return {
      statusCode: 200,
      body: {
        state: data?.state || 'executed',
        results,
        affectedRows:
          results.reduce((total, result) => {
            return total + (result.rows?.length || 0)
          }, 0) || 0
      }
    }
  }

  static adaptQueryFromExecute(httpResponse) {
    const data = httpResponse.data || httpResponse.body
    const results = data.data || data

    // Execute returns array of results, get first one
    if (!Array.isArray(results) || results.length === 0) {
      return {
        statusCode: 200,
        body: {
          results: [
            {
              rows: [],
              columns: [],
              rowsAffected: 0,
              executionTime: 0,
              success: true
            }
          ]
        }
      }
    }

    const result = results[0]
    return {
      statusCode: 200,
      body: {
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
    }
  }

  static adaptExecuteResult(httpResponse) {
    const data = httpResponse.data || httpResponse.body

    // A API retorna data como array de objetos com results ou error
    const results =
      data?.data?.map((item) => {
        // Se há erro no item, retornar estrutura de erro
        if (item.error) {
          return {
            error: item.error,
            columns: [],
            rows: [],
            statement: null,
            query_duration_ms: null,
            rows_read: null,
            rows_written: null
          }
        }

        // Se há results, processar normalmente
        return {
          columns: item.results?.columns || [],
          rows: item.results?.rows || [],
          statement: item.results?.statement,
          query_duration_ms: item.results?.query_duration_ms,
          rows_read: item.results?.rows_read,
          rows_written: item.results?.rows_written
        }
      }) || []

    return {
      statusCode: 200,
      body: {
        state: data?.state || 'executed',
        results,
        affectedRows:
          results.reduce((total, result) => {
            return total + (result.rows?.length || 0)
          }, 0) || 0
      }
    }
  }

  static getStatusSeverity(status) {
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

  static adaptDatabaseDelete(httpResponse) {
    const data = httpResponse.data || httpResponse.body

    if (data?.state === 'pending') {
      return 'Database deletion initiated. This may take a few moments.'
    }

    return 'Database successfully deleted'
  }

  static formatDate(dateString) {
    if (!dateString) return ''
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(dateString))
  }
}
