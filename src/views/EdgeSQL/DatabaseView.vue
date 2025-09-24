<script setup>
  import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { adaptSqlQuery } from '@/services/v2/utils/adapter/handleSqlCommand'

  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ResultsBlock from './FormFields/blocks/ResultsBlock.vue'
  import ListTablesBlock from './FormFields/blocks/ListTablesBlock.vue'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import Menu from 'primevue/menu'
  import QueryEditorBlock from './FormFields/blocks/QueryEditorBlock.vue'
  import SqlDefinition from './FormFields/blocks/SqlDefinition.vue'
  import TableInfo from './FormFields/blocks/TableInfo.vue'
  import QueryHistory from './components/QueryHistory.vue'
  import DeleteDialog from '@/templates/list-table-block/dialog/delete-dialog.vue'

  import { useDialog } from 'primevue/usedialog'
  import { useAccountStore } from '@/stores/account'
  import { useEdgeSQL } from './composable/useEdgeSQL'
  import { edgeSQLService } from '@/services/v2/edge-sql/edge-sql-service'
  import { SQLITE_QUERIES, QUICK_TEMPLATES } from './constants'
  import { TableActionManager } from './utils'

  defineOptions({ name: 'edge-sql-database-view' })

  const route = useRoute()
  const router = useRouter()
  const dialog = useDialog()
  const accountStore = useAccountStore()
  const sqlDatabase = useEdgeSQL()

  const databaseId = computed(() => route.params.id)
  const resultQuery = ref(null)

  const TAB_ROUTES = { results: 0, history: 1 }
  const ROUTE_TABS = { 0: 'results', 1: 'history' }

  const sqlQuery = ref('')
  const isExecutingQuery = ref(false)
  const isLoadingTables = ref(false)
  const executionTime = ref(0)
  const tablesTree = ref([])
  const selectedTableSchema = ref(null)
  const selectedTableDefinition = ref('')
  const isLoadingSchema = ref(false)
  const isLoadingDefinition = ref(false)
  const isEditorCollapsed = ref(true)
  const isTemplatesCollapsed = ref(true)
  const selectedTableName = ref(null)
  const activeTabIndex = ref(getTabIndexFromRoute())
  const tableMenuRef = ref()
  const selectedTable = ref(null)
  const drawerVisible = ref(false)
  const definitionDrawerVisible = ref(false)
  const databaseName = ref('')

  const monacoTheme = computed(() => {
    return accountStore.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })

  function getTabIndexFromRoute() {
    const tabParam = route.params.tab
    return TAB_ROUTES[tabParam] !== undefined ? TAB_ROUTES[tabParam] : 0
  }

  const loadDatabaseInfo = async () => {
    try {
      const database = await edgeSQLService.getDatabase(databaseId.value)
      databaseName.value = database.name
      sqlDatabase.setCurrentDatabase(database)
    } catch (error) {
      router.push('/sql-database')
    }
  }

  const loadTables = async () => {
    if (!databaseId.value) return

    isLoadingTables.value = true
    try {
      const result = await edgeSQLService.getTables(databaseId.value)

      sqlDatabase.setCurrentTables(result.body.tables)

      tablesTree.value = result.body.tables.map((table) => ({
        key: table.name,
        label: table.name,
        icon: 'pi pi-table',
        type: 'table',
        data: table,
        children: []
      }))
      if (tablesTree.value.length) {
        selectTable(tablesTree.value[0])
      }
    } finally {
      isLoadingTables.value = false
    }
  }

  const executeQuery = async () => {
    if (!sqlQuery.value.trim() || !databaseId.value) return

    isExecutingQuery.value = true
    const isSelectQuery = sqlQuery.value.trim().toLowerCase().startsWith('select')

    try {
      resultQuery.value = await sqlDatabase.executeQuery(sqlQuery.value)
      activeTabIndex.value = 0

      if (
        !isSelectQuery &&
        (sqlQuery.value.toLowerCase().includes('create table') ||
          sqlQuery.value.toLowerCase().includes('drop table') ||
          sqlQuery.value.toLowerCase().includes('alter table'))
      ) {
        await loadTables()
      }
    } finally {
      isExecutingQuery.value = false
    }
  }

  const useTemplate = (template) => {
    sqlQuery.value = template.query
    activeTabIndex.value = 0
    selectedTableName.value = null
    sqlDatabase.setSelectedTable(null)

    if (isEditorCollapsed.value) {
      isEditorCollapsed.value = false
    }
  }

  const rerunQuery = async (query) => {
    sqlQuery.value = query
    activeTabIndex.value = 0

    if (isEditorCollapsed.value) {
      isEditorCollapsed.value = false
    }

    await executeQuery()
  }

  const selectTable = async (node) => {
    const tableName = node.key || node.name
    selectedTableName.value = tableName
    sqlDatabase.setSelectedTable({ name: tableName })
    sqlQuery.value = SQLITE_QUERIES.SELECT_ALL(tableName)

    isLoadingSchema.value = true
    await loadTableSchema(tableName)

    activeTabIndex.value = 0
    await executeQuery()
  }

  const toggleTemplates = () => {
    isTemplatesCollapsed.value = !isTemplatesCollapsed.value
  }

  const loadTableSchema = async (tableName) => {
    isLoadingSchema.value = true
    try {
      const result = await edgeSQLService.queryDatabase(databaseId.value, {
        statements: SQLITE_QUERIES.TABLE_INFO(tableName),
        parameters: []
      })
      selectedTableSchema.value = {
        name: tableName,
        columns: result.results[0].columns || [],
        rows: result.results[0].rows || []
      }
    } finally {
      isLoadingSchema.value = false
    }
  }

  const loadTableDefinition = async (tableName) => {
    isLoadingDefinition.value = true
    selectedTableDefinition.value = ''
    try {
      const result = await edgeSQLService.queryDatabase(databaseId.value, {
        statements: SQLITE_QUERIES.TABLE_DEFINITION(tableName),
        parameters: []
      })

      if (result.results?.length > 0 && result.results[0].rows?.length > 0) {
        selectedTableDefinition.value =
          result.results[0].rows[0].sql || 'Table definition not found'
      } else {
        selectedTableDefinition.value = 'Table definition not found'
      }
    } catch (error) {
      selectedTableDefinition.value = `Error loading table definition: ${error.message}`
    } finally {
      isLoadingDefinition.value = false
    }
  }

  const showTableMenu = (event, table) => {
    if (selectedTable.value?.key === table.key) {
      tableMenuRef.value.toggle(event)
      return
    }

    if (tableMenuRef.value) {
      tableMenuRef.value.hide()
    }

    selectedTable.value = table

    nextTick(() => {
      tableMenuRef.value.show(event)
    })
  }

  const deleteTableService = async (tableName) => {
    await edgeSQLService.executeDatabase(databaseId.value, {
      statements: [`DROP TABLE ${tableName};`]
    })

    return `Table "${tableName}" deleted successfully`
  }

  const openDeleteTableDialog = (tableName) => {
    dialog.open(DeleteDialog, {
      data: {
        title: 'table',
        selectedID: tableName,
        selectedItemData: { name: tableName },
        deleteService: () => deleteTableService(tableName),
        deleteConfirmationText: tableName,
        entityDeleteMessage: `The table "${tableName}" will be permanently deleted along with all its data. This action cannot be undone.`,
        onSuccess: async () => {
          await loadTables()
          if (selectedTableName.value === tableName) {
            selectedTableName.value = null
            sqlDatabase.setSelectedTable(null)
          }
        }
      }
    })
  }

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

  const handleKeyDown = (event) => {
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault()
      if (!isExecutingQuery.value && sqlQuery.value.trim()) {
        executeQuery()
      }
    }
  }

  const handleCreateTable = () => {
    sqlQuery.value = QUICK_TEMPLATES[0].query
    activeTabIndex.value = 0
  }

  const extractTableNameFromSelect = (selectQuery) => {
    if (!selectQuery) return null
    const cleanQuery = selectQuery.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')

    const fromRegex = /\bFROM\s+(?:`([^`]+)`|"([^"]+)"|(\w+))/i
    const match = cleanQuery.match(fromRegex)

    if (match) {
      return match[1] || match[2] || match[3]
    }

    return null
  }

  const findFirstSelectQuery = (queries) => {
    if (!Array.isArray(queries)) return null

    for (const query of queries) {
      const trimmedQuery = query.trim().toUpperCase()
      if (trimmedQuery.startsWith('SELECT')) {
        return query
      }
    }

    return null
  }

  const setSqlQuery = (query) => {
    sqlQuery.value = query
    const adaptedQuery = adaptSqlQuery(query)
    const firstSelectQuery = findFirstSelectQuery(adaptedQuery)
    const tableName = extractTableNameFromSelect(firstSelectQuery)
    sqlDatabase.setSelectedTable({ name: tableName })
    selectedTableName.value = tableName
    executeQuery()
  }

  const handleTabChange = (index) => {
    const tabRoute = ROUTE_TABS[index]
    if (tabRoute) {
      router.push(`/sql-database/database/${databaseId.value}/${tabRoute}`)
    }
  }

  onMounted(async () => {
    await loadDatabaseInfo()
    await loadTables()

    document.addEventListener('keydown', handleKeyDown)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })

  watch(databaseId, async (newId) => {
    if (newId) {
      await loadDatabaseInfo()
      await loadTables()
    }
  })

  watch(
    () => route.params.tab,
    (newTab) => {
      const newIndex = TAB_ROUTES[newTab] !== undefined ? TAB_ROUTES[newTab] : 0
      if (activeTabIndex.value !== newIndex) {
        activeTabIndex.value = newIndex
      }
    },
    { immediate: true }
  )

  watch(activeTabIndex, (newIndex) => {
    const currentTab = route.params.tab
    const expectedTab = ROUTE_TABS[newIndex]

    if (currentTab !== expectedTab) {
      handleTabChange(newIndex)
    }
  })
</script>

<template>
  <div>
    <ContentBlock data-testid="edge-sql-database-content-block">
      <template #heading>
        <PageHeadingBlock
          :pageTitle="databaseName"
          data-testid="edge-sql-database-heading"
        />
      </template>
      <template #content>
        <div class="h-full">
          <div class="flex flex-col sm:flex-row h-full gap-3">
            <ListTablesBlock
              :tablesTree="tablesTree"
              :isLoadingTables="isLoadingTables"
              :isTemplatesCollapsed="isTemplatesCollapsed"
              :selectedTableName="selectedTableName"
              @select-table="selectTable"
              @show-table-menu="showTableMenu"
              @toggle-templates="toggleTemplates"
              @use-template="useTemplate"
              @create-table="handleCreateTable"
            />

            <div class="flex-1 min-w-0">
              <div class="h-full flex flex-column gap-2 overflow-hidden">
                <div class="flex-shrink-0">
                  <QueryEditorBlock
                    :sqlQuery="sqlQuery"
                    :queryResults="resultQuery"
                    :executionTime="executionTime"
                    :isExecutingQuery="isExecutingQuery"
                    :monacoTheme="monacoTheme"
                    :tablesTree="tablesTree"
                    @execute-query="setSqlQuery"
                  />
                </div>

                <div>
                  <TabView
                    v-model:activeIndex="activeTabIndex"
                    @tab-change="handleTabChange"
                    class="results-tabs mt-4"
                  >
                    <TabPanel header="Results">
                      <ResultsBlock
                        :queryResults="resultQuery"
                        :isExecutingQuery="isExecutingQuery"
                        :tableName="selectedTableName"
                        :currentQuery="sqlQuery"
                        @execute-query="setSqlQuery"
                      />
                    </TabPanel>

                    <TabPanel header="History">
                      <QueryHistory
                        v-if="activeTabIndex === 1"
                        @rerun-query="rerunQuery"
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

    <TableInfo
      :selected-table-schema="selectedTableSchema"
      :is-loading-schema="isLoadingSchema"
      :schema-visible="drawerVisible"
      @close="drawerVisible = false"
    />

    <SqlDefinition
      :selected-table="selectedTable"
      :selected-table-definition="selectedTableDefinition"
      :is-loading-definition="isLoadingDefinition"
      :definition-visible="definitionDrawerVisible"
      @close="definitionDrawerVisible = false"
    />

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

<style scoped></style>
