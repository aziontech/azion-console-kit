// Queries úteis para operações em tabelas SQLite
export const TABLE_QUERIES = {
  // Informações básicas
  COUNT_RECORDS: (tableName) => `SELECT COUNT(*) as total_rows FROM ${tableName};`,
  TABLE_INFO: (tableName) => `PRAGMA table_info(${tableName});`,
  TABLE_DEFINITION: (tableName) =>
    `SELECT sql FROM sqlite_master WHERE type='table' AND name='${tableName}';`,

  // Índices e performance
  TABLE_INDEXES: (tableName) => `PRAGMA index_list(${tableName});`,

  // Estrutura e relacionamentos
  FOREIGN_KEYS: (tableName) => `PRAGMA foreign_key_list(${tableName});`,
  TABLE_SIZE: (tableName) => `SELECT 
    name,
    COUNT(*) as row_count
  FROM ${tableName}, sqlite_master 
  WHERE sqlite_master.name = '${tableName}';`,

  // Queries de limpeza
  VACUUM_ANALYZE: () => `VACUUM; ANALYZE;`,
  DELETE_ALL: (tableName) => `DELETE FROM ${tableName};`,
  TRUNCATE_SIMULATION: (tableName) => `DELETE FROM ${tableName}; VACUUM;`,

  // Tamanho do banco de dados
  DATABASE_SIZE: () => `SELECT 
    (page_count * page_size) AS size_bytes,
    ROUND((page_count * page_size) / 1024.0, 2) AS size_kb,
    ROUND((page_count * page_size) / 1048576.0, 2) AS size_mb
  FROM 
    pragma_page_count(), pragma_page_size();`
}

// Ações disponíveis para o menu contextual da tabela
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

// Classe para gerenciar ações de tabela
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
    if (action.type === 'query') {
      return this.executeQueryAction(action, tableName)
    } else if (action.type === 'drawer') {
      return this.executeDrawerAction(action, tableName)
    } else if (action.type === 'delete') {
      return this.executeDeleteAction(action, tableName)
    }
  }

  async executeQueryAction(action, tableName) {
    // Gerar a query
    const query = typeof action.query === 'function' ? action.query(tableName) : action.query

    // Configurar o editor
    this.sqlQuery.value = query

    // Expandir editor se estiver colapsado
    if (this.isEditorCollapsed.value) {
      this.isEditorCollapsed.value = false
    }

    // Mudar para aba Results
    this.activeTabIndex.value = 0

    // Executar a query automaticamente
    await this.executeQuery()
  }

  executeDrawerAction(action, tableName) {
    // Delegar para a função de drawer específica
    if (this.showDrawer[action.action]) {
      this.showDrawer[action.action](tableName)
    }
  }

  executeDeleteAction(action, tableName) {
    // Abrir dialog de confirmação de delete
    if (this.openDeleteDialog) {
      this.openDeleteDialog(tableName)
    }
  }

  // Gerar itens do menu dinamicamente
  generateMenuItems(tableName) {
    return TABLE_MENU_ACTIONS.map((action) => {
      if (action.separator) {
        return { separator: true }
      }

      return {
        label: action.label,
        icon: action.icon,
        command: async () => {
          // Confirmar ação se necessário
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
