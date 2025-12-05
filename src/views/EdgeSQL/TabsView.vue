<script setup>
  import { ref, reactive, watch, computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { edgeSQLService } from '@/services/v2/edge-sql/edge-sql-service'
  import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
  import { useEdgeSQL } from './composable/useEdgeSQL'
  import MainSettings from './MainSettings.vue'
  import TablesView from './TablesView.vue'
  import CodeEditor from './CodeEditor.vue'

  defineOptions({ name: 'tabs-sql-database' })

  const mapTabs = ref({ tables: 0, editor: 1, settings: 2 })
  const route = useRoute()
  const router = useRouter()
  const { setCurrentTables, setCurrentDatabase } = useEdgeSQL()

  const activeTab = ref(0)
  const sqlDatabaseId = ref(route.params.id)
  const loadedTables = ref(false)
  const listTables = ref([])
  const showSnippetsCreateTable = ref(false)
  const tabHasUpdate = reactive({ oldTab: null, nextTab: 0, updated: 0 })
  const database = ref(null)
  const title = ref('')
  const codeEditorRef = ref(null)

  const getTabFromValue = (selectedTabIndex) => {
    const tabNames = Object.keys(mapTabs.value)
    return tabNames.find((tabName) => mapTabs.value[tabName] === selectedTabIndex)
  }

  const changeTab = (index) => {
    const tab = getTabFromValue(index)
    activeTab.value = index
    const params = { id: sqlDatabaseId.value, tab }
    const { query } = route
    router.push({ name: 'database-sql-database', params, query })
  }

  const getDatabase = async () => {
    const data = await edgeSQLService.getDatabase(sqlDatabaseId.value)
    database.value = data
    setCurrentDatabase(data)
    title.value = data?.name || ''
  }

  const loadTables = async () => {
    try {
      loadedTables.value = true
      const result = await edgeSQLService.getTables(sqlDatabaseId.value)
      setCurrentTables(result.body.tables)
      listTables.value = result.body.tables
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error)
    } finally {
      loadedTables.value = false
    }
  }

  const changeRouteByClickingOnTab = ({ index = 0 }) => changeTab(index)

  const goEditor = () => {
    showSnippetsCreateTable.value = true
    changeTab(mapTabs.value.editor)
  }

  const handleExecuteQuery = (sql) => {
    changeTab(mapTabs.value.editor)
    codeEditorRef.value?.setSql?.(sql)
  }

  const emit = defineEmits(['show-table-info', 'show-definition'])
  const handleShowTableInfo = (tableName) => emit('show-table-info', tableName)
  const handleShowDefinition = (tableName) => emit('show-definition', tableName)

  const renderTabCurrentRouter = async () => {
    const { tab = 0 } = route.params
    await getDatabase()
    const activeTabIndexByRoute = mapTabs.value[tab]
    changeRouteByClickingOnTab({ index: activeTabIndexByRoute })
  }

  watch(activeTab, (newValue, oldValue) => {
    tabHasUpdate.oldTab = oldValue
    tabHasUpdate.nextTab = newValue
    tabHasUpdate.updated = generateCurrentTimestamp()
  })

  const showActionBar = computed(() => activeTab.value === mapTabs.value.settings)
  const showTablesView = computed(() => activeTab.value === mapTabs.value.tables)

  renderTabCurrentRouter()
  loadTables()
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        :pageTitle="title"
        :loadedItemLabel="title"
      />
    </template>
    <template #content>
      <TabView
        :activeIndex="activeTab"
        @tab-click="changeRouteByClickingOnTab"
        class="w-full h-full"
      >
        <TabPanel
          header="Tables"
          :pt="{
            root: { 'data-testid': 'sql-database-tabs__tab__tables' }
          }"
        >
          <TablesView
            @go-editor="goEditor"
            v-if="showTablesView"
            @load-tables="loadTables"
            :listTables="listTables"
            :isLoadTables="loadedTables"
            @execute-query="handleExecuteQuery"
            @show-table-info="handleShowTableInfo"
            @show-definition="handleShowDefinition"
          />
        </TabPanel>
        <TabPanel
          header="Editor"
          :pt="{
            root: { 'data-testid': 'sql-database-tabs__tab__editor' }
          }"
        >
          <CodeEditor
            ref="codeEditorRef"
            :listTables="listTables"
            :showSnippetsCreateTable="showSnippetsCreateTable"
            @update:show-snippets-create-table="(v) => (showSnippetsCreateTable = v)"
          />
        </TabPanel>
        <TabPanel
          header="Settings"
          :pt="{
            root: { 'data-testid': 'sql-database-tabs__tab__settings' }
          }"
        >
          <MainSettings
            v-if="database"
            :database="database"
            :showActionBar="showActionBar"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
