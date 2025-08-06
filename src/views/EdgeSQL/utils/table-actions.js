export const TABLE_QUERIES = {
  COUNT_RECORDS: (tableName) => `SELECT COUNT(*) as total_rows FROM ${tableName};`,
  TABLE_INFO: (tableName) => `PRAGMA table_info(${tableName});`,
  TABLE_DEFINITION: (tableName) =>
    `SELECT sql FROM sqlite_master WHERE type='table' AND name='${tableName}';`,

  TABLE_INDEXES: (tableName) => `PRAGMA index_list(${tableName});`,

  FOREIGN_KEYS: (tableName) => `PRAGMA foreign_key_list(${tableName});`,
  TABLE_SIZE: (tableName) => `SELECT 
    name,
    COUNT(*) as row_count
  FROM ${tableName}, sqlite_master 
  WHERE sqlite_master.name = '${tableName}';`,

  VACUUM_ANALYZE: () => `VACUUM; ANALYZE;`,
  DELETE_ALL: (tableName) => `DELETE FROM ${tableName};`,
  TRUNCATE_SIMULATION: (tableName) => `DELETE FROM ${tableName}; VACUUM;`,

  DATABASE_SIZE: () => `SELECT 
    (page_count * page_size) AS size_bytes,
    ROUND((page_count * page_size) / 1024.0, 2) AS size_kb,
    ROUND((page_count * page_size) / 1048576.0, 2) AS size_mb
  FROM 
    pragma_page_count(), pragma_page_size();`
}

export const TABLE_MENU_ACTIONS = [
  {
    label: 'Table Info',
    icon: 'pi pi-info-circle',
    type: 'drawer',
    action: 'showTableInfo'
  },
  {
    label: 'View Definition',
    icon: 'pi pi-code',
    type: 'drawer',
    action: 'showDefinition'
  },
  {
    separator: true
  },
  {
    label: 'Count Records',
    icon: 'pi pi-calculator',
    type: 'query',
    query: TABLE_QUERIES.COUNT_RECORDS,
    description: 'Count total number of rows'
  },

  {
    separator: true
  },
  {
    label: 'Schema Info',
    icon: 'pi pi-list',
    type: 'query',
    query: TABLE_QUERIES.TABLE_INFO,
    description: 'Show detailed column information'
  },
  {
    label: 'View Indexes',
    icon: 'pi pi-bookmark',
    type: 'query',
    query: TABLE_QUERIES.TABLE_INDEXES,
    description: 'Show table indexes'
  },
  {
    label: 'Foreign Keys',
    icon: 'pi pi-link',
    type: 'query',
    query: TABLE_QUERIES.FOREIGN_KEYS,
    description: 'Show foreign key relationships'
  },
  {
    label: 'Database Size',
    icon: 'pi pi-database',
    type: 'query',
    query: TABLE_QUERIES.DATABASE_SIZE,
    description: 'Show database disk space usage'
  },
  {
    separator: true
  },
  {
    label: 'Delete Table',
    icon: 'pi pi-trash',
    type: 'delete',
    description: 'Permanently delete this table'
  }
]

const ACTION_HANDLERS = {
  query: 'executeQueryAction',
  drawer: 'executeDrawerAction',
  delete: 'executeDeleteAction'
}

export class TableActionManager {
  constructor(
    executeQueryFn,
    showDrawerFn,
    activeTabIndexRef,
    isEditorCollapsedRef,
    sqlQueryRef,
    deleteDialogFn
  ) {
    this.executeQuery = executeQueryFn
    this.showDrawer = showDrawerFn
    this.activeTabIndex = activeTabIndexRef
    this.isEditorCollapsed = isEditorCollapsedRef
    this.sqlQuery = sqlQueryRef
    this.openDeleteDialog = deleteDialogFn
  }

  async executeTableAction(action, tableName) {
    const handlerName = ACTION_HANDLERS[action.type]
    if (handlerName && this[handlerName]) {
      return this[handlerName](action, tableName)
    }
  }

  async executeQueryAction(action, tableName) {
    const query = typeof action.query === 'function' ? action.query(tableName) : action.query

    this.sqlQuery.value = query

    if (this.isEditorCollapsed.value) {
      this.isEditorCollapsed.value = false
    }

    this.activeTabIndex.value = 0

    await this.executeQuery()
  }

  executeDrawerAction(action, tableName) {
    if (this.showDrawer[action.action]) {
      this.showDrawer[action.action](tableName)
    }
  }

  executeDeleteAction(action, tableName) {
    if (this.openDeleteDialog) {
      this.openDeleteDialog(tableName)
    }
  }

  generateMenuItems(tableName) {
    return TABLE_MENU_ACTIONS.map((action) => {
      if (action.separator) {
        return { separator: true }
      }

      return {
        label: action.label,
        icon: action.icon,
        command: async () => {
          if (action.confirmMessage) {
            if (!confirm(action.confirmMessage)) {
              return
            }
          }

          await this.executeTableAction(action, tableName)
        }
      }
    })
  }
}
