<script setup>
  import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from 'primevue/usetoast'

  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

  import Button from 'primevue/button'
  import DataTable from 'primevue/datatable'
  import Column from 'primevue/column'
  import Tag from 'primevue/tag'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import Skeleton from 'primevue/skeleton'
  import Menu from 'primevue/menu'
  import Accordion from 'primevue/accordion'
  import AccordionTab from 'primevue/accordiontab'

  import { useDialog } from 'primevue/usedialog'

  import { useEdgeSQLStore } from '@/stores/edge-sql'
  import { edgeSQLService } from '@/services/v2'
  import QueryHistory from './components/QueryHistory.vue'
  import DeleteDialog from '@/templates/list-table-block/dialog/delete-dialog.vue'
  import RowFormDrawer from './components/RowFormDrawer.vue'
  import InfoDrawerBlock from '@templates/info-drawer-block'
  import InfoSection from '@templates/info-drawer-block/info-section'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import { QUICK_TEMPLATES, SQLITE_QUERIES } from './constants/queries'
  import { TableActionManager } from './utils/table-actions'
  import { useAccountStore } from '@/stores/account'

  defineOptions({ name: 'edge-sql-database-view' })

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()
  const dialog = useDialog()
  const sqlStore = useEdgeSQLStore()
  const accountStore = useAccountStore()

  const documentationService = () => {
    window.open('https://www.azion.com/en/documentation/products/edge-sql/', '_blank')
  }

  const databaseId = computed(() => route.params.id)
  const databaseName = computed(() => {
    const name = sqlStore.currentDatabase?.name
    if (name && typeof name === 'object' && name.text !== undefined) {
      return name.text || name.content || null
    }
    return name || null
  })
  const sqlQuery = ref('SELECT 1 as test_column;')
  const isExecutingQuery = ref(false)
  const isLoadingTables = ref(false)
  const queryResults = ref([])
  const executionTime = ref(0)
  const affectedRows = ref(0)

  // Dados das tabelas para o Tree
  const tablesTree = ref([])
  const selectedTableSchema = ref(null)
  const selectedTableDefinition = ref('')
  const isLoadingSchema = ref(false)
  const isLoadingDefinition = ref(false)
  const isEditorCollapsed = ref(true)
  const isTemplatesCollapsed = ref(true)
  const selectedTableName = ref(null) // Tabela atualmente selecionada/ativa

  // Estado da interface
  const activeTabIndex = ref(1)
  const tableMenuRef = ref()
  const selectedTable = ref(null)
  const selectedRows = ref([])

  // Paginação dos resultados
  const rowsPerPage = ref(20)
  const currentPage = ref(0)

  // Função para lidar com mudanças de paginação
  const onPageChange = (event) => {
    currentPage.value = event.page
    rowsPerPage.value = event.rows
  }

  // Carregar informações do banco de dados
  const loadDatabaseInfo = async () => {
    try {
      const result = await edgeSQLService.getDatabase(databaseId.value)

      if (result.statusCode === 200) {
        const database = result.body

        // Verificar se o database está pronto para uso
        if (database.status === 'creating') {
          toast.add({
            severity: 'warn',
            summary: 'Database Creating',
            detail:
              'This database is still being created. You will be redirected to monitor the process.',
            life: 4000
          })
          router.push('/edge-sql')
          return
        }

        if (database.status !== 'created' && database.status !== 'ready') {
          toast.add({
            severity: 'error',
            summary: 'Database Unavailable',
            detail: 'This database is not available for queries at the moment.',
            life: 5000
          })
          router.push('/edge-sql')
          return
        }

        sqlStore.setCurrentDatabase(database)
      } else {
        throw new Error(result.error || 'Database not found')
      }
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message,
        life: 5000
      })
      router.push('/edge-sql')
    }
  }

  // Carregar tabelas do banco
  const loadTables = async () => {
    if (!databaseId.value) return

    isLoadingTables.value = true
    try {
      const result = await edgeSQLService.getTables(databaseId.value)

      if (result.statusCode === 200) {
        sqlStore.setCurrentTables(result.body.tables)

        // Formatar para o componente Tree
        tablesTree.value = result.body.tables.map((table) => ({
          key: table.name,
          label: table.name,
          icon: 'pi pi-table',
          type: 'table',
          data: table,
          children: []
        }))
      }
    } catch (error) {
      toast.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Error loading tables: ' + error.message,
        life: 3000
      })
    } finally {
      isLoadingTables.value = false
    }
  }

  // Executar query
  const executeQuery = async (showToast = true) => {
    if (!sqlQuery.value.trim()) {
      if (showToast) {
        toast.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'Enter a query to execute',
          life: 3000
        })
      }
      return
    }

    if (!databaseId.value) {
      if (showToast) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Database not loaded. Please reload the page.',
          life: 5000
        })
      }
      return
    }

    isExecutingQuery.value = true
    const startTime = Date.now()

    try {
      // Detectar se é uma query SELECT ou um comando
      const isSelectQuery = sqlQuery.value.trim().toLowerCase().startsWith('select')

      const result = isSelectQuery
        ? await edgeSQLService.queryDatabase(databaseId.value, {
            statement: sqlQuery.value,
            parameters: []
          })
        : await edgeSQLService.executeDatabase(databaseId.value, {
            statements: [sqlQuery.value]
          })

      executionTime.value = Date.now() - startTime

      if (result.statusCode === 200) {
        queryResults.value = result.body.results || []
        affectedRows.value = result.body.affectedRows || 0

        // Limpar estados de edição e seleção
        selectedRows.value = []
        rowFormDrawerVisible.value = false
        isEditingRow.value = false
        editingRowData.value = {}
        editingRowIndex.value = -1

        // Resetar paginação para primeira página
        currentPage.value = 0

        // Adicionar ao histórico
        sqlStore.addQueryResult({
          query: sqlQuery.value,
          results: result.body.results,
          timestamp: new Date(),
          executionTime: executionTime.value,
          type: isSelectQuery ? 'query' : 'execute'
        })

        activeTabIndex.value = 0 // Mudar para aba de resultados

        // Mostrar toast apenas se solicitado (execução manual)
        if (showToast) {
          const stats = getQueryStats(queryResults.value)
          const apiDuration = stats?.duration || executionTime.value

          toast.add({
            severity: 'success',
            summary: 'Success',
            detail: `Query executed in ${apiDuration}ms`,
            life: 3000
          })
        }

        // Recarregar tabelas se foi um comando DDL
        if (
          !isSelectQuery &&
          (sqlQuery.value.toLowerCase().includes('create table') ||
            sqlQuery.value.toLowerCase().includes('drop table') ||
            sqlQuery.value.toLowerCase().includes('alter table'))
        ) {
          await loadTables()
        }

        // As estatísticas já são mostradas automaticamente na interface
      } else {
        throw new Error(result.error || 'Error executing query')
      }
    } catch (error) {
      // Sempre mostrar erros
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message,
        life: 5000
      })
    } finally {
      isExecutingQuery.value = false
    }
  }

  // Quick query templates - importado do arquivo de constants
  const quickTemplates = computed(() => {
    return QUICK_TEMPLATES.map((template) => ({
      ...template,
      icon: getTemplateIcon(template.name)
    }))
  })

  const getTemplateIcon = (templateName) => {
    const icons = {
      'Create Table': 'pi pi-plus',
      'Insert Data': 'pi pi-pencil',
      'Select All': 'pi pi-search',
      'Count Records': 'pi pi-calculator',
      'Update Record': 'pi pi-sync',
      'Delete Record': 'pi pi-trash',
      'Create Index': 'pi pi-bookmark',
      'Drop Table': 'pi pi-times',
      'Alter Table': 'pi pi-wrench',
      'Vector Table': 'pi pi-sitemap',
      'Insert Vectors': 'pi pi-share-alt',
      'Vector Search': 'pi pi-compass',
      'Create Vector Index': 'pi pi-objects-column',
      'Vector Top K Query': 'pi pi-chart-line'
    }
    return icons[templateName] || 'pi pi-code'
  }

  const useTemplate = (template) => {
    sqlQuery.value = template.query
    activeTabIndex.value = 0
    // Desselecionar tabela ativa
    selectedTableName.value = null
    sqlStore.setSelectedTable(null)
    // Expandir editor automaticamente para mostrar a query
    if (isEditorCollapsed.value) {
      isEditorCollapsed.value = false
    }
  }

  const rerunQuery = async (query) => {
    sqlQuery.value = query
    activeTabIndex.value = 0
    // Expandir o editor se estiver colapsado para mostrar a query
    if (isEditorCollapsed.value) {
      isEditorCollapsed.value = false
    }
    // Executar a query automaticamente
    await executeQuery()
  }

  const clearHistory = () => {
    // Visual feedback when history is cleared
    toast.add({
      severity: 'info',
      summary: 'History Cleared',
      detail: 'Query history has been cleared successfully',
      life: 2000
    })
  }

  const selectTable = async (node) => {
    const tableName = node.key || node.name
    selectedTableName.value = tableName // Marcar tabela como selecionada/ativa
    sqlStore.setSelectedTable({ name: tableName })
    sqlQuery.value = SQLITE_QUERIES.SELECT_ALL(tableName)

    // Ativar skeleton imediatamente
    isLoadingSchema.value = true

    // Carregar schema da tabela
    await loadTableSchema(tableName)

    // Executar automaticamente a query e mostrar na aba Results (sem toast)
    activeTabIndex.value = 0 // Mudar para aba Results
    await executeQuery(false) // false = não mostrar toast
  }

  const toggleTemplates = () => {
    isTemplatesCollapsed.value = !isTemplatesCollapsed.value
  }

  const loadTableSchema = async (tableName) => {
    isLoadingSchema.value = true
    try {
      const result = await edgeSQLService.queryDatabase(databaseId.value, {
        statement: SQLITE_QUERIES.TABLE_INFO(tableName),
        parameters: []
      })

      if (result.statusCode === 200 && result.body.results?.length > 0) {
        selectedTableSchema.value = {
          name: tableName,
          columns: result.body.results[0].rows || []
        }
      }
    } catch (error) {
      // Silently handle schema loading errors
    } finally {
      isLoadingSchema.value = false
    }
  }

  const loadTableDefinition = async (tableName) => {
    isLoadingDefinition.value = true
    selectedTableDefinition.value = ''
    try {
      // Obter a definição CREATE TABLE do SQLite
      const result = await edgeSQLService.queryDatabase(databaseId.value, {
        statement: SQLITE_QUERIES.TABLE_DEFINITION(tableName),
        parameters: []
      })

      if (
        result.statusCode === 200 &&
        result.body.results?.length > 0 &&
        result.body.results[0].rows?.length > 0
      ) {
        selectedTableDefinition.value =
          result.body.results[0].rows[0][0] || 'Table definition not found'
      } else {
        selectedTableDefinition.value = 'Table definition not found'
      }
    } catch (error) {
      selectedTableDefinition.value = `Error loading table definition: ${error.message}`
    } finally {
      isLoadingDefinition.value = false
    }
  }

  const copyDefinition = () => {
    if (!selectedTableDefinition.value) return

    navigator.clipboard.writeText(selectedTableDefinition.value).then(() => {
      toast.add({
        severity: 'success',
        summary: 'Copied',
        detail: 'Table definition copied to clipboard',
        life: 2000
      })
    })
  }

  // Monaco Editor theme configuration para SQL
  const monacoTheme = computed(() => {
    return accountStore.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })

  const sqlMonacoOptions = {
    readOnly: true,
    minimap: { enabled: false },
    tabSize: 2,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    fontSize: 14,
    lineNumbers: 'on',
    folding: false,
    glyphMargin: false,
    lineDecorationsWidth: 6,
    lineNumbersMinChars: 3,
    renderLineHighlight: 'none',
    padding: { top: 10, bottom: 10 },
    wordWrap: 'on',
    contextmenu: false,
    selectOnLineNumbers: false,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    rulers: [],
    bracketPairColorization: { enabled: false },
    matchBrackets: 'never',
    renderIndentGuides: false,
    guides: {
      indentation: false,
      bracketPairs: false,
      bracketPairsHorizontal: false,
      highlightActiveIndentation: false
    },
    scrollbar: {
      vertical: 'hidden',
      horizontal: 'hidden'
    }
  }

  // Menu actions for tables
  const showTableMenu = (event, table) => {
    // Se é a mesma tabela, apenas alternar o menu
    if (selectedTable.value?.key === table.key) {
      tableMenuRef.value.toggle(event)
      return
    }

    // Fechar menu anterior se estiver aberto
    if (tableMenuRef.value) {
      tableMenuRef.value.hide()
    }

    selectedTable.value = table

    // Usar nextTick para garantir que o estado foi atualizado
    nextTick(() => {
      tableMenuRef.value.show(event)
    })
  }

  // Estado dos drawers
  const drawerVisible = ref(false)
  const definitionDrawerVisible = ref(false)
  const rowFormDrawerVisible = ref(false)
  const isEditingRow = ref(false)
  const editingRowData = ref({})
  const editingRowIndex = ref(-1)

  const copyTableDefinition = async () => {
    if (!selectedTableDefinition.value) return

    try {
      // Carregar definição se ainda não foi carregada
      if (!selectedTableDefinition.value) {
        await loadTableDefinition(selectedTableSchema.value.name)
      }

      await navigator.clipboard.writeText(selectedTableDefinition.value || '')
      toast.add({
        severity: 'success',
        summary: 'Copied',
        detail: 'Table definition copied to clipboard',
        life: 2000
      })
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to copy table definition',
        life: 3000
      })
    }
  }

  // Serviço para deletar tabela usando SQL DROP TABLE
  const deleteTableService = async (tableName) => {
    try {
      const result = await edgeSQLService.executeDatabase(databaseId.value, {
        statements: [`DROP TABLE ${tableName};`]
      })

      if (result.statusCode === 200) {
        // Recarregar lista de tabelas
        await loadTables()
        // Limpar seleção se a tabela deletada estava selecionada
        if (selectedTableName.value === tableName) {
          selectedTableName.value = null
          sqlStore.setSelectedTable(null)
          queryResults.value = []
        }
        return `Table "${tableName}" deleted successfully`
      } else {
        throw new Error(result.error || 'Failed to delete table')
      }
    } catch (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }
  }

  // Função para abrir dialog de confirmação de delete de tabela
  const openDeleteTableDialog = (tableName) => {
    dialog.open(DeleteDialog, {
      data: {
        title: 'table',
        selectedID: tableName,
        selectedItemData: { name: tableName },
        deleteService: () => deleteTableService(tableName),
        deleteConfirmationText: tableName,
        entityDeleteMessage: `The table "${tableName}" will be permanently deleted along with all its data. This action cannot be undone.`,
        onSuccess: () => {
          // Já é tratado no deleteTableService
        }
      }
    })
  }

  // Inicializar o gerenciador de ações de tabela
  const tableActionManager = new TableActionManager(
    executeQuery,
    {
      showTableInfo: (tableName) => {
        isLoadingSchema.value = true
        drawerVisible.value = true
        loadTableSchema(tableName)
      },
      showDefinition: (tableName) => {
        isLoadingDefinition.value = true
        definitionDrawerVisible.value = true
        loadTableDefinition(tableName)
      }
    },
    activeTabIndex,
    isEditorCollapsed,
    sqlQuery,
    openDeleteTableDialog
  )

  const tableMenuItems = computed(() => {
    if (!selectedTable.value) return []
    return tableActionManager.generateMenuItems(selectedTable.value.key)
  })

  // Formatação de resultados
  const formatResultColumns = (result) => {
    return (
      result.columns?.map((col) => ({
        field: col,
        header: col
      })) || []
    )
  }

  // Verificar se uma coluna é Primary Key
  const isPrimaryKey = (columnName) => {
    if (!selectedTableSchema.value?.columns) return false
    const columnInfo = selectedTableSchema.value.columns.find((col) => col[1] === columnName)
    return columnInfo ? columnInfo[5] === 1 : false // col[5] é o campo pk
  }

  const formatResultData = (result) => {
    if (!result.rows || !result.columns) return []

    return result.rows.map((row, rowIndex) => {
      const obj = { _rowId: rowIndex, _originalRow: row } // Manter dados originais
      result.columns.forEach((col, index) => {
        const value = row[index]
        obj[col] = value // Sempre manter o valor original para edição
      })
      return obj
    })
  }

  // Função para detectar se há erro no resultado
  const hasResultError = (result) => {
    // Estrutura padrão: result.errors (array)
    if (result?.errors && Array.isArray(result.errors) && result.errors.length > 0) {
      return true
    }

    // Estrutura do serviço corrigido: result.error (string)
    if (result?.error && typeof result.error === 'string') {
      return true
    }

    return false
  }

  // Função para extrair mensagem de erro do resultado
  const getResultError = (result) => {
    if (!hasResultError(result)) return null

    // Estrutura padrão: result.errors (array)
    if (result?.errors && Array.isArray(result.errors) && result.errors.length > 0) {
      const error = result.errors[0]
      return error.detail || error.title || 'Unknown error occurred'
    }

    // Estrutura do serviço corrigido: result.error (string)
    if (result?.error && typeof result.error === 'string') {
      return result.error
    }

    return 'Unknown error occurred'
  }

  // Função para extrair estatísticas dos resultados
  const getQueryStats = (results) => {
    if (!Array.isArray(results) || results.length === 0) return null

    // Somar estatísticas de todos os resultados
    const stats = results.reduce(
      (acc, result) => {
        return {
          duration: Math.max(acc.duration, result.query_duration_ms || 0),
          rowsRead: acc.rowsRead + (result.rows_read || 0),
          rowsWritten: acc.rowsWritten + (result.rows_written || 0),
          totalRows: acc.totalRows + (result.rows?.length || 0)
        }
      },
      { duration: 0, rowsRead: 0, rowsWritten: 0, totalRows: 0 }
    )

    return stats
  }

  // Função para formatar valores de células para visualização
  const formatCellValue = (value) => {
    if (value === null) return 'NULL'
    if (value === undefined) return 'UNDEFINED'
    if (value === '') return '(empty)'

    // Para objetos complexos, mostrar conteúdo real quando possível
    if (value !== null && value !== undefined && typeof value === 'object') {
      // Se tem propriedades específicas de BLOB/Vector
      if (value.type && value.data) {
        return `${value.type}(${value.data.length || 'unknown size'})`
      } else if (Array.isArray(value)) {
        // Para arrays pequenos, mostrar conteúdo; para grandes, mostrar resumo
        if (value.length <= 5) {
          return `[${value.join(', ')}]`
        } else {
          return `Array[${value.length}] [${value.slice(0, 3).join(', ')}, ...]`
        }
      } else if (value.constructor === Uint8Array || value.constructor === ArrayBuffer) {
        return `BLOB(${value.byteLength || value.length} bytes)`
      } else {
        // Para objetos simples, mostrar conteúdo real
        const keys = Object.keys(value)
        if (keys.length === 1) {
          const firstKey = keys[0]
          const firstValue = value[firstKey]

          // Se é um valor simples, mostrar ele
          if (typeof firstValue === 'string' || typeof firstValue === 'number') {
            if (typeof firstValue === 'string' && firstValue.length > 50) {
              return `"${firstValue.substring(0, 47)}..."`
            } else {
              return String(firstValue)
            }
          }
        }

        // Fallback para objetos complexos
        try {
          const jsonStr = JSON.stringify(value)
          if (jsonStr.length <= 100) {
            return jsonStr
          } else {
            return `${jsonStr.substring(0, 97)}...`
          }
        } catch {
          return `Object{${keys.length} keys}`
        }
      }
    }

    return value
  }

  // Serviço para deletar linhas usando SQL DELETE
  const deleteRowsService = async (selectedID, selectedItemData) => {
    try {
      if (!selectedTableName.value || !selectedTableSchema.value?.columns) {
        throw new Error('Table information not available')
      }

      const tableName = selectedTableName.value
      const columnInfo = selectedTableSchema.value.columns

      // selectedItemData pode ser um único objeto ou array
      const rowsToDelete = Array.isArray(selectedItemData) ? selectedItemData : [selectedItemData]

      // Construir queries DELETE para cada linha selecionada
      const deleteQueries = rowsToDelete.map((rowData) => {
        // Construir condição WHERE usando todas as colunas da linha
        const whereConditions = []

        // Tentar usar chave primária primeiro
        const primaryKeys = columnInfo.filter((col) => col[5] === 1) // col[5] é o campo pk

        // Verificar se temos chaves primárias com valores não-nulos
        let usePrimaryKeys = false
        if (primaryKeys.length > 0) {
          primaryKeys.forEach((col) => {
            const columnName = col[1]
            const columnType = col[2]
            const value = rowData[columnName]

            if (value !== undefined && value !== null && value !== '') {
              const escapedValue = escapeValue(value, columnType)
              whereConditions.push(`${columnName} = ${escapedValue}`)
              usePrimaryKeys = true
            }
          })
        }

        // Se não temos PKs válidas, usar todas as colunas não-nulas
        if (!usePrimaryKeys) {
          // Se não há chave primária, usar todas as colunas não-nulas
          Object.keys(rowData).forEach((columnName) => {
            if (columnName !== '_rowId') {
              const value = rowData[columnName]

              if (value !== undefined && value !== null && value !== '') {
                const columnType = getColumnTypeFromInfo(columnName, columnInfo)
                const escapedValue = escapeValue(value, columnType)
                whereConditions.push(`${columnName} = ${escapedValue}`)
              }
            }
          })
        }

        if (whereConditions.length === 0) {
          throw new Error('Cannot delete row: no valid conditions found')
        }

        return `DELETE FROM ${tableName} WHERE ${whereConditions.join(' AND ')};`
      })

      // Executar todas as queries DELETE
      const result = await edgeSQLService.executeDatabase(databaseId.value, {
        statements: deleteQueries
      })

      if (result.statusCode === 200) {
        const successMessage = `Successfully deleted ${rowsToDelete.length} row(s)`
        return successMessage
      } else {
        throw new Error(result.error || 'Failed to delete rows')
      }
    } catch (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }
  }

  // Função utilitária para escapar valores SQL (reutilizada)
  const escapeValue = (value, columnType) => {
    if (value === null || value === undefined || value === '') {
      return 'NULL'
    }

    const strValue = value.toString().trim()

    // Para tipos numéricos, não colocar aspas se for um número válido
    if (
      columnType &&
      (columnType.toUpperCase().includes('INTEGER') ||
        columnType.toUpperCase().includes('REAL') ||
        columnType.toUpperCase().includes('NUMERIC'))
    ) {
      // Verificar se é um número válido
      if (!isNaN(strValue) && strValue !== '') {
        return strValue
      }
    }

    // Para outros tipos, escapar aspas simples e colocar entre aspas
    return `'${strValue.replace(/'/g, "''")}'`
  }

  // Função utilitária para obter tipo da coluna
  const getColumnTypeFromInfo = (columnName, columnInfo) => {
    const info = columnInfo.find((col) => col[1] === columnName)
    return info ? info[2] : 'TEXT'
  }

  const deleteSelectedRows = () => {
    if (selectedRows.value.length === 0) return

    const selectedCount = selectedRows.value.length

    // Preparar dados das linhas selecionadas (sem _rowId)
    const selectedRowsData = selectedRows.value.map((row) => {
      const cleanRow = { ...row }
      delete cleanRow._rowId
      return cleanRow
    })

    // Abrir dialog de confirmação seguindo o padrão do projeto
    dialog.open(DeleteDialog, {
      data: {
        title: `row${selectedCount > 1 ? 's' : ''}`,
        selectedID: selectedCount,
        selectedItemData: selectedRowsData,
        deleteService: deleteRowsService,
        deleteConfirmationText: 'DELETE',
        entityDeleteMessage: `The selected ${selectedCount} row${
          selectedCount > 1 ? 's' : ''
        } will be permanently deleted from the table. This action cannot be undone.`,
        onSuccess: async () => {
          // Limpar seleção e recarregar dados
          selectedRows.value = []
          if (selectedTableName.value && sqlQuery.value) {
            await executeQuery(false)
          }
        }
      }
    })
  }

  const exportSelectedRows = () => {
    if (selectedRows.value.length === 0) return

    const exportData = selectedRows.value.map((row) => {
      const cleanRow = { ...row }
      delete cleanRow._rowId
      return cleanRow
    })

    const csv = convertToCSV(exportData)
    downloadCSV(csv, `edge-sql-selected-rows-${new Date().toISOString().split('T')[0]}.csv`)
  }

  const exportAllResults = () => {
    if (queryResults.value.length === 0) return

    const result = queryResults.value[0]
    const exportData = formatResultData(result).map((row) => {
      const cleanRow = { ...row }
      delete cleanRow._rowId
      return cleanRow
    })

    const csv = convertToCSV(exportData)
    downloadCSV(csv, `edge-sql-all-results-${new Date().toISOString().split('T')[0]}.csv`)
  }

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const downloadLink = document.createElement('a')
    downloadLink.href = url
    downloadLink.download = filename
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    URL.revokeObjectURL(url)
  }

  const convertToCSV = (data) => {
    if (!data.length) return ''

    const headers = Object.keys(data[0])
    const csvHeaders = headers.join(',')
    const csvRows = data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        })
        .join(',')
    )

    return [csvHeaders, ...csvRows].join('\n')
  }

  const clearRowFormState = () => {
    editingRowData.value = {}
    editingRowIndex.value = -1
    isEditingRow.value = false
    focusedField.value = ''
  }

  const openInsertRowDrawer = () => {
    if (queryResults.value.length === 0) return

    clearRowFormState()
    rowFormDrawerVisible.value = true
  }

  const focusedField = ref('')

  const openEditRowDrawer = (rowData, rowIndex, fieldToFocus = '') => {
    if (queryResults.value.length === 0) return

    const result = queryResults.value[0]
    if (!result.columns) return

    // Limpar estado anterior primeiro
    clearRowFormState()

    // Preparar dados para edição usando diretamente rowData
    isEditingRow.value = true
    editingRowData.value = {}

    // rowData já contém os dados formatados da linha
    result.columns.forEach((col) => {
      editingRowData.value[col] = rowData[col] || ''
    })

    // Definir qual campo deve receber o foco
    focusedField.value = fieldToFocus

    editingRowIndex.value = rowIndex
    rowFormDrawerVisible.value = true
  }

  const handleRowFormSuccess = async () => {
    // Limpar todos os estados primeiro
    selectedRows.value = []
    editingRowData.value = {}
    editingRowIndex.value = -1
    isEditingRow.value = false
    focusedField.value = ''
    rowFormDrawerVisible.value = false

    // Recarregar os dados da tabela executando a query novamente
    if (selectedTableName.value && sqlQuery.value) {
      await executeQuery(false) // false = não mostrar toast da query
    }

    // Não mostrar toast aqui - deixar o template base mostrar
    // para evitar notificações duplicadas
  }

  // Estado para controlar clique vs double-click
  const clickTimeout = ref(null)

  // Função para copiar valor da célula (só no clique simples)
  const copyToClipboard = async (rowData, fieldName) => {
    try {
      // Usar o valor original da linha em vez do valor formatado
      const originalRow = rowData._originalRow
      const result = queryResults.value[0]

      if (originalRow && result?.columns) {
        const fieldIndex = result.columns.indexOf(fieldName)
        const originalValue = fieldIndex >= 0 ? originalRow[fieldIndex] : rowData[fieldName]

        // Para objetos complexos, tentar JSON.stringify
        let textToCopy = ''
        if (originalValue === null || originalValue === undefined) {
          textToCopy = 'NULL'
        } else if (typeof originalValue === 'object') {
          try {
            textToCopy = JSON.stringify(originalValue, null, 2)
          } catch {
            textToCopy = String(originalValue)
          }
        } else {
          textToCopy = String(originalValue)
        }

        await navigator.clipboard.writeText(textToCopy)

        toast.add({
          severity: 'success',
          summary: 'Copied',
          detail: `${fieldName}: value copied to clipboard`,
          life: 2000
        })
      } else {
        throw new Error('Could not access original data')
      }
    } catch (error) {
      toast.add({
        severity: 'warn',
        summary: 'Copy failed',
        detail: 'Could not copy to clipboard',
        life: 2000
      })
    }
  }

  // Gerenciar clique simples vs double-click
  const handleCellClick = (rowData, fieldName) => {
    // Cancelar timeout anterior se existir
    if (clickTimeout.value) {
      clearTimeout(clickTimeout.value)
    }

    // Definir timeout para clique simples
    clickTimeout.value = setTimeout(() => {
      copyToClipboard(rowData, fieldName)
      clickTimeout.value = null
    }, 250) // 250ms para detectar double-click
  }

  // Gerenciar double-click (cancelar cópia e abrir drawer)
  const handleCellDoubleClick = (data, index, field) => {
    // Cancelar timeout do clique simples
    if (clickTimeout.value) {
      clearTimeout(clickTimeout.value)
      clickTimeout.value = null
    }

    // Abrir drawer
    openEditRowDrawer(data, index, field)
  }

  const monacoOptions = {
    minimap: { enabled: false },
    tabSize: 2,
    formatOnPaste: true,
    wordWrap: 'on',
    automaticLayout: true,
    scrollBeyondLastLine: false,
    fontSize: 13,
    lineNumbers: 'on',
    folding: false,
    glyphMargin: false,
    lineDecorationsWidth: 6,
    lineNumbersMinChars: 3,
    renderLineHighlight: 'none',
    padding: { top: 10, bottom: 10 }
  }

  // Função para lidar com atalhos de teclado
  const handleKeyDown = (event) => {
    // Ctrl+Enter para executar query
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault()
      if (!isExecutingQuery.value && sqlQuery.value.trim()) {
        executeQuery()
      }
    }
  }

  onMounted(async () => {
    await loadDatabaseInfo()
    await loadTables()

    // Adicionar listener para atalhos de teclado
    document.addEventListener('keydown', handleKeyDown)
  })

  onBeforeUnmount(() => {
    // Remover listener quando componente for desmontado
    document.removeEventListener('keydown', handleKeyDown)
  })

  watch(databaseId, async (newId) => {
    if (newId) {
      await loadDatabaseInfo()
      await loadTables()
    }
  })

  watch(databaseId, async (newId) => {
    if (newId) {
      await loadTables()
    }
  })

  // Limpar estado quando o drawer fechar
  watch(rowFormDrawerVisible, (newVisible) => {
    if (!newVisible) {
      // Delay para permitir animações antes de limpar
      setTimeout(() => {
        clearRowFormState()
      }, 300)
    }
  })
</script>

<template>
  <div>
    <ContentBlock data-testid="edge-sql-database-content-block">
      <template #heading>
        <PageHeadingBlock
          :pageTitle="databaseName || databaseId"
          data-testid="edge-sql-database-heading"
        >
          <template #actions>
            <div class="flex gap-2">
              <Button
                label="Back to Databases"
                icon="pi pi-arrow-left"
                class="p-button-outlined"
                @click="router.push('/edge-sql')"
              />
            </div>
          </template>
        </PageHeadingBlock>
      </template>
      <template #content>
        <div class="sql-interface h-full overflow-hidden">
          <div class="flex h-full gap-3 p-3">
            <!-- Database structure sidebar - Fixed width -->
            <div
              class="database-sidebar flex-shrink-0 bg-surface-0 border-round-lg border-1 surface-border"
              style="width: 320px"
            >
              <div class="h-full flex flex-column overflow-hidden">
                <!-- Tables Section - Takes available space -->
                <div class="p-4 flex-grow-1 overflow-hidden flex flex-column">
                  <h3
                    class="text-sm font-semibold mb-3 text-color flex items-center gap-2 flex-shrink-0"
                  >
                    <i class="pi pi-database text-primary"></i>
                    Tables
                  </h3>

                  <div
                    v-if="isLoadingTables"
                    class="flex-grow-1 overflow-y-auto pr-1"
                  >
                    <div
                      v-for="i in 3"
                      :key="`skeleton-${i}`"
                      class="flex items-center justify-between px-3 py-2 border-round min-h-10"
                    >
                      <div class="flex items-center gap-3">
                        <Skeleton class="w-5 h-5 border-round flex-shrink-0" />
                        <Skeleton
                          class="h-4"
                          style="width: 120px"
                        />
                      </div>
                      <div class="flex-shrink-0">
                        <Skeleton class="w-8 h-8 border-round" />
                      </div>
                    </div>
                  </div>

                  <div
                    v-else-if="tablesTree.length === 0"
                    class="flex-grow-1"
                  >
                    <EmptyResultsBlock
                      title="No tables found"
                      description="Use CREATE TABLE statements to create your first table"
                      :documentationService="documentationService"
                      :inTabs="true"
                      :noBorder="true"
                    >
                      <template #illustration>
                        <i class="pi pi-database text-4xl text-primary opacity-50"></i>
                      </template>
                    </EmptyResultsBlock>
                  </div>

                  <div
                    v-else
                    class="flex-grow-1 overflow-y-auto pr-1"
                  >
                    <div
                      v-for="table in tablesTree"
                      :key="table.key"
                      class="group flex items-center justify-between px-3 py-2 hover:bg-surface-50 dark:hover:bg-surface-700 border-round cursor-pointer transition-all duration-200 min-h-10"
                      :class="{ 'surface-200': selectedTableName === table.key }"
                      @click="selectTable(table)"
                    >
                      <div class="flex items-center gap-3 text-left">
                        <i class="pi pi-table text-primary text-sm flex-shrink-0"></i>
                        <span class="text-sm font-medium text-color">{{ table.label }}</span>
                      </div>
                      <div class="flex-shrink-0">
                        <Button
                          icon="pi pi-ellipsis-h"
                          size="small"
                          outlined
                          v-tooltip.top="{ value: 'Actions', showDelay: 200 }"
                          class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer table-button"
                          @click.stop="showTableMenu($event, table)"
                          aria-haspopup="true"
                          aria-controls="table_menu"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Quick Templates Section - Fixed at bottom -->
                <div
                  class="flex-shrink-0 border-top-1 surface-border templates-section"
                  :class="{ 'p-4': !isTemplatesCollapsed, 'px-4 py-3': isTemplatesCollapsed }"
                >
                  <div
                    class="flex items-center justify-between cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors p-2 -m-2 border-round"
                    :class="{ 'mb-3': !isTemplatesCollapsed }"
                    @click="toggleTemplates"
                  >
                    <h3 class="text-sm font-semibold text-color flex items-center gap-2">
                      <i class="pi pi-bolt text-primary text-lg"></i>
                      Quick Templates
                    </h3>
                    <i
                      :class="isTemplatesCollapsed ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
                      class="text-color-secondary hover:text-primary text-sm"
                    />
                  </div>
                  <div
                    v-show="!isTemplatesCollapsed"
                    class="templates-content"
                  >
                    <div
                      class="flex flex-column gap-1 overflow-y-auto"
                      style="max-height: 350px"
                    >
                      <div
                        v-for="template in quickTemplates"
                        :key="template.name"
                        class="group flex items-center gap-3 px-3 py-2 hover:bg-surface-50 dark:hover:bg-surface-700 border-round cursor-pointer transition-colors duration-200 min-h-10"
                        @click="useTemplate(template)"
                      >
                        <i :class="template.icon + ' text-primary text-sm flex-shrink-0'"></i>
                        <span class="text-sm font-medium text-color">{{ template.name }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Main SQL interface -->
            <div class="flex-1 min-w-0">
              <div class="h-full flex flex-column gap-2 overflow-hidden">
                <!-- SQL Editor -->
                <div class="flex-shrink-0">
                  <Accordion :activeIndex="isEditorCollapsed ? null : 0">
                    <AccordionTab>
                      <template #header>
                        <div class="flex items-center gap-2">
                          <i class="pi pi-code text-primary"></i>
                          <span class="font-semibold text-color">Query Editor</span>
                        </div>
                      </template>

                      <div class="p-3 editor-content">
                        <div
                          class="sql-editor-container mb-3 border-1 surface-border overflow-hidden"
                          style="height: 180px"
                        >
                          <vue-monaco-editor
                            v-model:value="sqlQuery"
                            language="sql"
                            :theme="monacoTheme"
                            :options="{ ...monacoOptions, readOnly: isExecutingQuery }"
                            class="w-full h-full"
                          />
                        </div>

                        <div class="flex justify-content-between align-items-center">
                          <div class="flex align-items-center gap-3">
                            <Button
                              :label="isExecutingQuery ? 'Executing...' : 'Execute Query'"
                              :icon="isExecutingQuery ? 'pi pi-spin pi-spinner' : 'pi pi-play'"
                              severity="primary"
                              :loading="isExecutingQuery"
                              @click="executeQuery"
                              :disabled="!sqlQuery.trim() || isExecutingQuery"
                              class="font-medium"
                              v-tooltip.top="'Execute Query (Ctrl+Enter)'"
                            />
                            <Button
                              label="Clear"
                              icon="pi pi-delete-left"
                              severity="secondary"
                              outlined
                              @click="sqlQuery = ''"
                              :disabled="isExecutingQuery"
                            />
                          </div>

                          <div
                            v-if="queryResults.length > 0"
                            class="flex align-items-center gap-3 text-sm text-color-secondary px-3 py-1 bg-surface-100 dark:bg-surface-700 border-round"
                          >
                            <!-- Tempo de execução real da API -->
                            <div
                              v-if="getQueryStats(queryResults)?.duration"
                              class="flex align-items-center gap-1"
                            >
                              <i class="pi pi-clock text-xs"></i>
                              <span>{{ getQueryStats(queryResults).duration }}ms</span>
                            </div>
                            <!-- Fallback para tempo calculado -->
                            <div
                              v-else-if="executionTime > 0"
                              class="flex align-items-center gap-1"
                            >
                              <i class="pi pi-clock text-xs"></i>
                              <span>{{ executionTime }}ms</span>
                            </div>

                            <!-- Estatísticas de leitura e escrita -->
                            <div
                              v-if="getQueryStats(queryResults)?.rowsRead !== undefined"
                              class="flex align-items-center gap-1"
                            >
                              <i class="pi pi-eye text-xs"></i>
                              <span>{{ getQueryStats(queryResults).rowsRead }} read</span>
                            </div>
                            <div
                              v-if="getQueryStats(queryResults)?.rowsWritten !== undefined"
                              class="flex align-items-center gap-1"
                            >
                              <i class="pi pi-pencil text-xs"></i>
                              <span>{{ getQueryStats(queryResults).rowsWritten }} written</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionTab>
                  </Accordion>
                </div>

                <!-- Results and History -->
                <div
                  class="flex-grow-1 bg-surface-0 border-round-lg border-1 surface-border overflow-hidden"
                >
                  <TabView
                    v-model:activeIndex="activeTabIndex"
                    class="h-full results-tabs"
                  >
                    <TabPanel>
                      <template #header>
                        <div class="flex items-center gap-2">
                          <i class="pi pi-table"></i>
                          <span>Results</span>
                        </div>
                      </template>

                      <!-- Loading skeleton durante execução de query -->
                      <div
                        v-if="isExecutingQuery"
                        class="results-container overflow-y-auto pr-2"
                        :style="{
                          'max-height': isEditorCollapsed
                            ? 'calc(100vh - 300px)'
                            : 'calc(100vh - 450px)'
                        }"
                      >
                        <div class="mb-6">
                          <div
                            class="flex justify-content-between align-items-center mb-3 p-3 bg-surface-50 dark:bg-surface-800 border-round-lg"
                          >
                            <h4 class="text-base font-semibold text-color flex items-center gap-2">
                              <i class="pi pi-list text-primary"></i>
                              Query Results
                              <i class="pi pi-spin pi-spinner text-primary text-sm ml-2"></i>
                            </h4>
                          </div>

                          <div
                            class="border-round-lg shadow-sm border-1 surface-border overflow-hidden"
                          >
                            <DataTable
                              :value="Array(5)"
                              scrollable
                              scrollHeight="300px"
                              class="w-full"
                            >
                              <Column
                                v-for="col in 4"
                                :key="col"
                                :header="`Column ${col}`"
                                style="min-width: 120px"
                              >
                                <template #body>
                                  <Skeleton class="h-4" />
                                </template>
                              </Column>
                            </DataTable>
                          </div>
                        </div>
                      </div>

                      <!-- Estado vazio quando não há resultados -->
                      <div
                        v-else-if="queryResults.length === 0"
                        class="flex flex-col items-center justify-center h-full text-center p-8"
                      >
                        <i class="pi pi-search text-6xl text-primary mb-4 opacity-50"></i>
                        <h3 class="text-xl font-medium text-color mb-2">Ready to execute</h3>
                        <p class="text-color-secondary">Execute a query to see the results here</p>
                      </div>

                      <!-- Resultados -->
                      <div
                        v-else
                        class="results-container overflow-y-auto pr-2"
                        :style="{
                          'max-height': isEditorCollapsed
                            ? 'calc(100vh - 300px)'
                            : 'calc(100vh - 450px)'
                        }"
                      >
                        <div
                          v-for="(result, index) in queryResults"
                          :key="index"
                          class="mb-6"
                        >
                          <div
                            class="flex justify-content-between align-items-center mb-3 p-3 bg-surface-50 dark:bg-surface-800 border-round-lg"
                          >
                            <h4 class="text-base font-semibold text-color flex items-center gap-2">
                              <i class="pi pi-list text-primary"></i>
                              {{
                                queryResults.length > 1 ? `Result ${index + 1}` : 'Query Results'
                              }}
                              <Tag
                                v-if="result.rows?.length"
                                :value="`${result.rows.length} row${
                                  result.rows.length !== 1 ? 's' : ''
                                }`"
                                severity="success"
                                class="text-xs"
                              />
                            </h4>

                            <!-- Toolbar das Ações -->
                            <div class="flex items-center gap-2">
                              <Button
                                v-if="result.columns?.length > 0"
                                label="Insert"
                                icon="pi pi-plus"
                                severity="primary"
                                class="p-button-sm font-medium"
                                @click="openInsertRowDrawer"
                              />
                              <Button
                                icon="pi pi-file-export"
                                severity="secondary"
                                class="p-button-text p-button-sm !flex !items-center !justify-center w-8 h-8"
                                @click="exportAllResults"
                                :disabled="!result.rows?.length"
                                v-tooltip.top="'Export all results to CSV'"
                              />
                              <Button
                                icon="pi pi-download"
                                severity="secondary"
                                class="p-button-text p-button-sm !flex !items-center !justify-center w-8 h-8"
                                @click="exportSelectedRows"
                                :disabled="selectedRows.length === 0"
                                v-tooltip.top="`Export ${selectedRows.length || 0} selected row(s)`"
                              />
                              <Button
                                icon="pi pi-trash"
                                severity="danger"
                                class="p-button-text p-button-sm !flex !items-center !justify-center w-8 h-8"
                                @click="deleteSelectedRows"
                                :disabled="selectedRows.length === 0"
                                v-tooltip.top="`Delete ${selectedRows.length || 0} selected row(s)`"
                              />
                            </div>
                          </div>

                          <!-- Mostrar erro quando há erro na query -->
                          <div
                            v-if="hasResultError(result)"
                            class="text-center p-6 bg-surface-50 dark:bg-surface-800 border-round-lg border-1 surface-border"
                          >
                            <i class="pi pi-exclamation-triangle text-3xl text-orange-500 mb-3"></i>
                            <p class="text-lg font-semibold text-color mb-2">Query Error</p>
                            <p
                              class="text-sm text-color-secondary font-mono bg-surface-100 dark:bg-surface-700 px-3 py-2 border-round inline-block"
                            >
                              {{ getResultError(result) }}
                            </p>
                          </div>

                          <!-- Mostrar tabela quando há colunas (com ou sem dados) -->
                          <div
                            v-else-if="result.columns?.length > 0"
                            class="border-round-lg shadow-sm border-1 surface-border overflow-hidden"
                          >
                            <DataTable
                              :value="formatResultData(result)"
                              v-model:selection="selectedRows"
                              dataKey="_rowId"
                              scrollable
                              :scrollHeight="
                                formatResultData(result).length > 20 ? '400px' : '300px'
                              "
                              class="w-full"
                              selectionMode="checkbox"
                              :metaKeySelection="false"
                              :paginator="formatResultData(result).length > 20"
                              :rows="rowsPerPage"
                              :rowsPerPageOptions="[10, 20, 50, 100]"
                              @page="onPageChange"
                              :pt="{
                                bodyRow: {
                                  class: ({ instance }) => {
                                    return instance.isSelected
                                      ? 'bg-primary-50 dark:bg-primary-900/20'
                                      : ''
                                  }
                                }
                              }"
                            >
                              <!-- Coluna de seleção fixa -->
                              <Column
                                selectionMode="multiple"
                                headerStyle="width: 2rem"
                                bodyStyle="width: 2rem"
                                :exportable="false"
                                :frozen="true"
                                alignFrozen="left"
                              ></Column>

                              <!-- Colunas de dados -->
                              <Column
                                v-for="(column, colIndex) in formatResultColumns(result)"
                                :key="column.field"
                                :field="column.field"
                                :style="{ maxWidth: '300px', minWidth: '120px' }"
                                :frozen="colIndex === 0 && isPrimaryKey(column.field)"
                                :alignFrozen="
                                  colIndex === 0 && isPrimaryKey(column.field) ? 'left' : undefined
                                "
                              >
                                <!-- Header padrão sem ícone de chave -->
                                <template #header>
                                  <span>{{ column.header }}</span>
                                </template>

                                <template #body="{ data, field, index }">
                                  <div
                                    class="table-cell-content cursor-pointer"
                                    @click="
                                      handleCellClick(data, field);
                                      $event.stopPropagation();
                                    "
                                    @dblclick="
                                      handleCellDoubleClick(data, index, field);
                                      $event.stopPropagation();
                                    "
                                    :title="`Click to copy • Double-click to edit`"
                                  >
                                    <span
                                      class="cell-value"
                                      :class="{
                                        'text-color-secondary italic':
                                          data[field] === null || data[field] === undefined
                                      }"
                                    >
                                      {{ formatCellValue(data[field]) }}
                                    </span>
                                  </div>
                                </template>
                              </Column>
                            </DataTable>

                            <!-- Mensagem quando não há dados, mas mantém a tabela visível -->
                            <div
                              v-if="!result.rows?.length"
                              class="text-center p-4 text-color-secondary bg-surface-50 dark:bg-surface-800"
                            >
                              <i class="pi pi-info-circle mr-2"></i>
                              No results found
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabPanel>

                    <TabPanel>
                      <template #header>
                        <div class="flex items-center gap-2">
                          <i class="pi pi-history"></i>
                          <span>History</span>
                        </div>
                      </template>

                      <QueryHistory
                        @rerun-query="rerunQuery"
                        @clear-history="clearHistory"
                      />
                    </TabPanel>
                  </TabView>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </ContentBlock>

    <!-- Table Info Drawer -->
    <InfoDrawerBlock
      v-model:visible="drawerVisible"
      :title="selectedTableSchema ? `Table Info: ${selectedTableSchema.name}` : 'Table Information'"
    >
      <template #body>
        <div class="w-full flex flex-col gap-8 max-md:gap-6">
          <!-- Skeleton Loading State -->
          <div
            v-if="isLoadingSchema"
            class="w-full"
          >
            <!-- Header Section Skeleton -->
            <div class="flex flex-col gap-8 max-md:gap-6">
              <div
                class="max-w-screen-3xl mx-auto gap-4 w-full surface-section rounded-md border surface-border p-3 sm:p-8 flex-wrap min-w-[2rem]"
              >
                <div class="flex items-center gap-3 mb-4">
                  <Skeleton class="w-32 h-6" />
                  <Skeleton class="w-20 h-6 rounded-full" />
                </div>
                <div class="flex justify-content-between align-items-center w-full">
                  <Skeleton class="w-24 h-6 rounded-full" />
                  <Skeleton class="w-32 h-8 rounded" />
                </div>
              </div>

              <!-- Columns Section Skeleton -->
              <div
                class="max-w-screen-3xl mx-auto gap-4 w-full surface-section rounded-md border surface-border p-3 sm:p-8 flex-wrap min-w-[2rem]"
              >
                <Skeleton class="w-20 h-6 mb-4" />
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                  <div
                    v-for="i in 6"
                    :key="i"
                    class="p-4 border-round-md surface-border border-1"
                  >
                    <div class="flex flex-column gap-3">
                      <div class="flex align-items-center gap-2">
                        <Skeleton class="w-4 h-4" />
                        <Skeleton class="w-24 h-4" />
                      </div>
                      <Skeleton class="w-16 h-5 rounded" />
                      <div class="flex gap-1">
                        <Skeleton class="w-16 h-4 rounded-full" />
                        <Skeleton class="w-12 h-4 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Loaded Content -->
          <div
            v-else-if="selectedTableSchema"
            class="w-full"
          >
            <!-- Header Section with Table Info -->
            <InfoSection
              :title="selectedTableSchema.name"
              :loading="false"
              hideDivider
            >
              <template #body>
                <div class="flex justify-content-between align-items-center w-full">
                  <div class="flex align-items-center gap-2">
                    <Tag
                      icon="pi pi-table"
                      :value="`${selectedTableSchema.columns.length} columns`"
                      severity="info"
                    />
                  </div>
                  <Button
                    icon="pi pi-copy"
                    label="Copy Definition"
                    severity="secondary"
                    outlined
                    size="small"
                    @click="copyTableDefinition"
                  />
                </div>
              </template>
            </InfoSection>

            <!-- Columns Section -->
            <InfoSection
              title="Columns"
              :loading="false"
            >
              <template #body>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                  <div
                    v-for="(column, index) in selectedTableSchema.columns"
                    :key="index"
                    class="p-4 border-round-md surface-border border-1 hover:surface-100 dark:hover:surface-700 transition-colors"
                  >
                    <div class="flex flex-column gap-3">
                      <!-- Column Name and Type -->
                      <div class="flex align-items-center gap-2">
                        <i class="pi pi-bookmark text-primary text-sm"></i>
                        <span class="font-semibold text-color">{{ column[1] }}</span>
                      </div>

                      <!-- Data Type -->
                      <div class="text-xs text-color-secondary">
                        <span
                          class="font-mono bg-surface-100 dark:bg-surface-700 px-2 py-1 border-round"
                        >
                          {{ column[2] }}
                        </span>
                      </div>

                      <!-- Constraints -->
                      <div class="flex gap-1 flex-wrap">
                        <Tag
                          v-if="column[3]"
                          value="NOT NULL"
                          severity="warning"
                          class="text-xs"
                          style="font-size: 0.65rem; padding: 0.125rem 0.25rem"
                        />
                        <Tag
                          v-if="column[5]"
                          value="PRIMARY KEY"
                          severity="info"
                          class="text-xs"
                          style="font-size: 0.65rem; padding: 0.125rem 0.25rem"
                        />
                        <Tag
                          v-if="column[4]"
                          value="DEFAULT"
                          severity="secondary"
                          class="text-xs"
                          style="font-size: 0.65rem; padding: 0.125rem 0.25rem"
                          v-tooltip.top="`Default: ${column[4]}`"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </InfoSection>
          </div>

          <!-- Empty State -->
          <div
            v-else
            class="flex flex-col items-center justify-center p-8 text-center"
          >
            <i class="pi pi-table text-6xl text-primary mb-4 opacity-50"></i>
            <h4 class="text-lg font-medium text-color mb-2">Select a table</h4>
            <p class="text-color-secondary">
              Choose a table from the sidebar to view its definition
            </p>
          </div>
        </div>
      </template>
    </InfoDrawerBlock>

    <!-- SQL Definition Drawer -->
    <InfoDrawerBlock
      v-model:visible="definitionDrawerVisible"
      :title="selectedTable?.key ? `SQL Definition: ${selectedTable.key}` : 'SQL Definition'"
    >
      <template #body>
        <div class="w-full flex flex-col gap-8 max-md:gap-6">
          <!-- Skeleton Loading State -->
          <div
            v-if="isLoadingDefinition"
            class="w-full"
          >
            <!-- Header Section Skeleton -->
            <div class="flex flex-col gap-8 max-md:gap-6">
              <div
                class="max-w-screen-3xl mx-auto gap-4 w-full surface-section rounded-md border surface-border p-3 sm:p-8 flex-wrap min-w-[2rem]"
              >
                <div class="flex items-center gap-3 mb-4">
                  <Skeleton class="w-32 h-6" />
                </div>
                <div class="flex justify-content-between align-items-center w-full">
                  <Skeleton class="w-40 h-6 rounded-full" />
                  <Skeleton class="w-32 h-8 rounded" />
                </div>
              </div>

              <!-- SQL Statement Section Skeleton -->
              <div
                class="max-w-screen-3xl mx-auto gap-4 w-full surface-section rounded-md border surface-border p-3 sm:p-8 flex-wrap min-w-[2rem]"
              >
                <Skeleton class="w-40 h-6 mb-4" />
                <div class="bg-surface-50 dark:bg-surface-800 border-round-lg p-4">
                  <div class="flex flex-col gap-2">
                    <Skeleton class="w-48 h-4" />
                    <Skeleton class="w-full h-4" />
                    <Skeleton class="w-56 h-4" />
                    <Skeleton class="w-40 h-4" />
                    <Skeleton class="w-64 h-4" />
                    <Skeleton class="w-32 h-4" />
                    <Skeleton class="w-24 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Loaded Content -->
          <div
            v-else-if="selectedTableDefinition"
            class="w-full"
          >
            <!-- Header Section with Table Info -->
            <InfoSection
              :title="selectedTable?.key || 'Table'"
              :loading="false"
              hideDivider
            >
              <template #body>
                <div class="flex justify-content-between align-items-center w-full">
                  <div class="flex align-items-center gap-2">
                    <Tag
                      icon="pi pi-code"
                      value="CREATE TABLE Statement"
                      severity="info"
                    />
                  </div>
                  <Button
                    icon="pi pi-copy"
                    label="Copy Statement"
                    severity="secondary"
                    outlined
                    size="small"
                    @click="copyDefinition"
                  />
                </div>
              </template>
            </InfoSection>

            <!-- CREATE TABLE Statement Section -->
            <InfoSection
              title="CREATE TABLE Statement"
              :loading="false"
            >
              <template #body>
                <div
                  v-if="selectedTableDefinition"
                  class="sql-definition-display border-round-lg border-1 surface-border overflow-hidden w-full bg-surface-ground"
                >
                  <div
                    class="sql-definition-header p-2 border-bottom-1 surface-border bg-surface-50 dark:bg-surface-800 flex justify-content-between align-items-center"
                  >
                    <span class="text-xs text-color-secondary font-mono">SQLite</span>
                    <Button
                      icon="pi pi-copy"
                      class="p-button-text p-button-sm text-color-secondary hover:text-primary"
                      @click="copyDefinition"
                      v-tooltip.top="'Copy SQL'"
                    />
                  </div>
                  <div
                    class="sql-monaco-container border-round-lg overflow-hidden"
                    style="height: 350px"
                  >
                    <vue-monaco-editor
                      :key="selectedTableDefinition"
                      :value="selectedTableDefinition"
                      language="sql"
                      :theme="monacoTheme"
                      :options="sqlMonacoOptions"
                      class="w-full h-full"
                    />
                  </div>
                </div>
                <div
                  v-else
                  class="flex items-center justify-center h-24 text-color-secondary"
                >
                  <i class="pi pi-spin pi-spinner mr-2"></i>
                  Loading definition...
                </div>
              </template>
            </InfoSection>
          </div>

          <!-- Empty State -->
          <div
            v-else
            class="flex flex-col items-center justify-center p-8 text-center"
          >
            <i class="pi pi-code text-6xl text-primary mb-4 opacity-50"></i>
            <h4 class="text-lg font-medium text-color mb-2">No definition loaded</h4>
            <p class="text-color-secondary">
              Select a table and click "View Definition" from the menu to view its CREATE TABLE
              statement
            </p>
          </div>
        </div>
      </template>
    </InfoDrawerBlock>

    <!-- Row Form Drawer -->
    <RowFormDrawer
      v-model:visible="rowFormDrawerVisible"
      :columns="queryResults[0]?.columns || []"
      :columnInfo="selectedTableSchema?.columns || []"
      :tableName="selectedTableName || ''"
      :initialData="editingRowData || {}"
      :isEditing="isEditingRow"
      :focusField="focusedField || ''"
      @onSuccess="handleRowFormSuccess"
    />

    <!-- Table Menu -->
    <Menu
      ref="tableMenuRef"
      id="table_menu"
      :model="tableMenuItems"
      :popup="true"
      class="w-fit"
      :pt="{
        menuitem: ({ context }) => ({
          'data-testid': `table-menu-item-${context.item?.label
            ?.toLowerCase()
            .replace(/\s+/g, '-')}`
        })
      }"
    />
  </div>
</template>

<style scoped>
  .sql-interface {
    height: calc(100vh - 180px);
    max-height: calc(100vh - 180px);
  }

  /* Layout fixo sem splitter */
  .database-sidebar {
    min-width: 320px;
    max-width: 320px;
  }

  :deep(.p-textarea) {
    font-family: 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.4;
  }

  /* Melhorar alinhamento dos botões */
  :deep(.p-button.justify-content-start) {
    text-align: left;
  }

  /* Limitações de largura das células */
  :deep(.p-datatable .p-datatable-thead > tr > th) {
    max-width: 300px;
    min-width: 120px;
  }

  :deep(.p-datatable .p-datatable-tbody > tr > td) {
    max-width: 300px;
    min-width: 120px;
    overflow: hidden;
  }

  /* Estilos para células com conteúdo truncado */
  .table-cell-content {
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0.5rem;
    display: block;
    width: 100%;
  }

  .table-cell-content .cell-value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
    width: 100%;
  }

  /* Destacar linhas selecionadas */
  :deep(.p-datatable .p-datatable-tbody > tr.p-highlight) {
    background-color: var(--primary-50) !important;
  }

  :deep(.p-datatable .p-datatable-tbody > tr.p-highlight > td) {
    background-color: var(--primary-50) !important;
  }

  /* Scroll horizontal melhorado */
  :deep(.p-datatable-wrapper) {
    overflow-x: auto !important;
    max-width: 100%;
  }

  :deep(.p-datatable-wrapper::-webkit-scrollbar) {
    height: 8px;
  }

  :deep(.p-datatable-wrapper::-webkit-scrollbar-track) {
    background: var(--surface-100);
    border-radius: 4px;
  }

  :deep(.p-datatable-wrapper::-webkit-scrollbar-thumb) {
    background: var(--surface-300);
    border-radius: 4px;
  }

  :deep(.p-datatable-wrapper::-webkit-scrollbar-thumb:hover) {
    background: var(--surface-400);
  }

  /* Estilos para o Tree no panel esquerdo */
  :deep(.p-tree .p-treenode-content) {
    text-align: left !important;
  }

  :deep(.p-tree .p-treenode-label) {
    text-align: left !important;
  }

  /* Estilos para as tabs Results/History */
  :deep(.results-tabs .p-tabview-nav) {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--surface-border);
    padding: 0 1rem;
  }

  :deep(.results-tabs .p-tabview-nav-link) {
    padding: 0.75rem 1rem;
    margin-bottom: -1px;
    border-bottom: 3px solid transparent;
    background: transparent;
    color: var(--text-color-secondary) !important;
    transition: all 0.2s ease;
    font-weight: 500;
    border-radius: 0;
  }

  :deep(.results-tabs .p-tabview-nav-link:hover) {
    background: transparent;
    color: var(--text-color) !important;
    border-bottom-color: var(--surface-300);
  }

  :deep(.results-tabs .p-tabview-nav-link.p-highlight) {
    color: var(--primary-color) !important;
    border-bottom-color: var(--primary-color);
    background: transparent;
    font-weight: 600;
  }

  :deep(.results-tabs .p-tabview-panels) {
    background: transparent;
    border: none;
    padding: 1rem;
  }

  /* Scroll elegante para os resultados e sidebar */
  .results-container::-webkit-scrollbar {
    width: 6px;
  }

  .results-container::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 10px;
  }

  .results-container::-webkit-scrollbar-thumb {
    background: var(--surface-300);
    border-radius: 10px;
    transition: background 0.2s ease;
  }

  .results-container::-webkit-scrollbar-thumb:hover {
    background: var(--surface-400);
  }

  /* Animação para colapsar/expandir o SQL Editor */
  .editor-collapsed {
    max-height: 56px !important;
    overflow: hidden;
  }

  /* SQL Definition Display */
  .sql-definition-display {
    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  }
</style>
