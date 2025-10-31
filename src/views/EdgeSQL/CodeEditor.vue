<template>
  <div class="flex flex-col sm:flex-row mt-4 gap-8 w-full h-[calc(100vh-9.375rem)] overflow-hidden">
    <div class="flex flex-col !w-64 h-full">
      <QueryHistoryList
        v-model:searchTerm="searchTerm"
        :isLoading="isLoading"
        :history="filteredHistory"
        :selectedQueryId="selectedQueryId"
        @select="selectQuery"
        @open-menu="openHistoryMenu"
      />
    </div>
    <div class="flex-1 min-h-0 h-full min-w-0 overflow-hidden">
      <Menu
        ref="historyMenu"
        :model="historyMenuItems"
        popup
        appendTo="body"
        :pt="{ root: { 'data-history-menu': true } }"
      />
      <ResizableSplitter
        class="w-full h-full"
        :panelSizes="panelSizes"
        :minSize="[20, 5]"
        :maxSize="[80, 95]"
        :initialA="50"
        @update:panelSizes="onUpdatePanelSizes"
        @resizeend="onResizeEnd"
      >
        <template #panel-a>
          <div class="flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
            <div class="flex justify-between border-1 border surface-border rounded-t-md p-3">
              <Button
                :label="labelRunQuery"
                icon="pi pi-play"
                size="small"
                severity="primary"
                @click="runQuery"
                v-tooltip="{
                  value: 'Run Query (⌘ ↵)',
                  pt: {
                    arrow: { class: 'bg-primary text-white' }
                  }
                }"
              />

              <div class="flex gap-2">
                <Button
                  label="Prettify"
                  icon="pi pi-align-left"
                  size="small"
                  outlined
                  severity="secondary"
                  @click="prettifyCode"
                />
                <Button
                  label="Templates"
                  icon="pi pi-bolt"
                  size="small"
                  severity="secondary"
                  outlined
                  @click="showTemplatesModal = true"
                />
              </div>
            </div>
            <div class="flex-1 min-h-0 min-w-0 border-1 surface-border">
              <vue-monaco-editor
                :key="`editor-${panelSizes[0]}`"
                v-model:value="sqlQueryText"
                language="sql"
                :theme="monacoTheme"
                :options="{ ...monacoOptions, readOnly: isExecutingQuery }"
                class="w-full h-full"
              />
            </div>
          </div>
        </template>

        <template #panel-b>
          <div
            class="flex flex-col h-full min-h-0 min-w-0"
            :class="{ 'overflow-hidden': resultsView !== 'json' }"
          >
            <SqlDatabaseList
              class="flex-1 min-h-0"
              :class="{ 'overflow-auto': resultsView !== 'json' }"
              :data="dataFiltered"
              title="Results"
              :columns="resultColumns"
              data-testid="table-list"
              showGridlines
              :monacoTheme="monacoTheme"
              :delete-service="deleteService"
              :isLoading="isLoadingQuery"
              @row-edit-saved="handleActionRowTable"
              @row-edit-cancel="onRowEditCancel"
              @reload-table="reloadData"
              :disabled-action="isExecutingQuery || isLoadingQuery"
              @view-change="handleViewChange"
              :options="resultsViewOptions"
              :empty-block="{
                title: 'Ready to execute',
                description: 'Execute a query to see the results here'
              }"
            />
          </div>
        </template>
      </ResizableSplitter>
    </div>
    <QuickTemplates
      v-if="showTemplatesModal"
      :show-templates-modal="showTemplatesModal"
      @use-template="handleUseTemplate"
      @update:show-templates-modal="(v) => (showTemplatesModal = v)"
    />
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
  import { useRoute } from 'vue-router'

  import Button from 'primevue/button'
  import Menu from 'primevue/menu'
  import { useAccountStore } from '@/stores/account'

  import { useEdgeSQL } from './composable/useEdgeSQL'
  import { useSqlFormatter } from './composable/useSqlFormatter'
  import { useMonacoEditor } from './composable/useMonacoEditor'
  import { QUICK_TEMPLATES } from './constants/queries'
  import QuickTemplates from './FormFields/blocks/QuickTemplates.vue'
  import ResizableSplitter from '@/components/ResizableSplitter.vue'
  import SqlDatabaseList from '@/templates/list-table-block/sql-database-list.vue'
  import QueryHistoryList from './components/QueryHistoryList.vue'
  import {
    createDeleteService,
    createInsertRowService,
    createUpdateRowService
  } from './utils/row-actions'
  import { edgeSQLService } from '@/services/v2/edge-sql/edge-sql-service'

  defineOptions({ name: 'CodeEditor' })
  const props = defineProps({
    listTables: {
      type: Array,
      default: () => []
    },
    showSnippetsCreateTable: {
      type: Boolean,
      default: false
    }
  })
  const emit = defineEmits(['update:show-snippets-create-table'])

  const showTemplatesModal = ref(false)
  const sqlQueryText = ref('')
  const searchTerm = ref('')
  const isExecutingQuery = ref(false)
  const editorPanelSize = ref(70)
  const panelSizes = ref([editorPanelSize.value, 100 - editorPanelSize.value])
  const selectedQueryId = ref(null)
  const historyMenu = ref(null)
  const currentMenuQuery = ref(null)
  const selectedSqlText = ref('')
  const resultColumns = ref([])
  const activeTableName = ref('')
  const resultRows = ref([])
  const resultSchema = ref([])
  const resultsView = ref('table')
  const isLoadingQuery = ref(false)
  const resultsViewOptions = ref([
    {
      label: 'Table',
      value: 'table',
      icon: 'pi pi-table'
    },
    {
      label: 'Json',
      value: 'json',
      icon: 'ai ai-json'
    }
  ])

  const { formatSql } = useSqlFormatter()
  const {
    queryResults,
    isLoading,
    executeQuery,
    updateListHistory,
    removeQueryFromHistory,
    currentDatabase
  } = useEdgeSQL()
  const route = useRoute()

  const accountStore = useAccountStore()

  const monacoTheme = computed(() => {
    return accountStore.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })
  const { monacoOptions, waitForMonaco, registerSqlAutocomplete, disposeProvider } =
    useMonacoEditor()

  const filteredHistory = computed(() => {
    const term = searchTerm.value.trim().toLowerCase()
    if (!term) return queryResults.value
    return queryResults.value.filter((queryItem) => {
      const label = queryItem.label?.toString().toLowerCase() || ''
      const original = queryItem.originalQuery?.toString().toLowerCase() || ''
      return label.includes(term) || original.includes(term)
    })
  })

  const deleteService = createDeleteService(
    (stmts) => executeQuery(stmts),
    () => activeTableName.value,
    () => resultSchema.value,
    () => reloadData()
  )

  const insertRowService = createInsertRowService(
    (databaseId, payload) => edgeSQLService.insertRow(databaseId, payload),
    () => currentDatabase.value.id,
    () => activeTableName.value,
    () => resultSchema.value,
    () => reloadData()
  )

  const updateRowService = createUpdateRowService(
    (databaseId, payload) => edgeSQLService.updatedRow(databaseId, payload),
    () => currentDatabase.value.id,
    () => activeTableName.value,
    () => resultSchema.value,
    () => reloadData()
  )

  const labelRunQuery = computed(() => {
    return selectedSqlText.value ? 'Run Selected' : 'Run Query'
  })

  const dataFiltered = computed(() => {
    return Array.isArray(resultRows.value) ? resultRows.value : []
  })

  const handleViewChange = (view) => {
    resultsView.value = view.value
  }

  const historyMenuItems = computed(() => [
    {
      label: 'Run query',
      icon: 'pi pi-play',
      command: runHistoryQuery
    },
    {
      label: 'Delete query',
      icon: 'pi pi-trash',
      command: deleteHistoryQuery
    }
  ])

  const selectQuery = (query) => {
    selectedQueryId.value = query.id
    sqlQueryText.value = query.originalQuery
  }

  const handleActionRowTable = async (action) => {
    if (!action) return
    const { newData, oldData } = action
    if (newData?._isNew) {
      await insertRowService(newData)
    } else {
      await updateRowService(newData, oldData)
    }
  }

  const onRowEditCancel = () => {}

  const isRunShortcut = (event) => event.key === 'Enter' && (event.metaKey || event.ctrlKey)

  const handleGlobalKeydown = (event) => {
    if (isRunShortcut(event)) {
      event.preventDefault()
      runQuery()
    }
  }

  const handleSelectionChange = () => {
    let sel = ''
    if (typeof window.getSelection != 'undefined') {
      sel = window.getSelection().toString()
    } else if (typeof document.selection != 'undefined' && document.selection.type == 'Text') {
      sel = document.selection.createRange().text
    }
    selectedSqlText.value = sel
  }

  const openHistoryMenu = (event, query) => {
    currentMenuQuery.value = query
    historyMenu.value?.hide()
    historyMenu.value?.show(event)
    nextTick(() => {
      const target = event?.currentTarget
      const overlay = document.querySelector('[data-history-menu="true"]')
      if (!target || !overlay) return

      const rect = target.getBoundingClientRect()
      const overlayRect = overlay.getBoundingClientRect()
      const offset = 8
      let top = window.scrollY + rect.top
      let left = window.scrollX + rect.right + offset
      let origin = 'top left'

      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      if (left + overlayRect.width > window.scrollX + viewportWidth) {
        left = window.scrollX + rect.left - overlayRect.width - offset
        origin = 'top right'
      }

      if (top + overlayRect.height > window.scrollY + viewportHeight) {
        top = window.scrollY + rect.bottom - overlayRect.height
      }

      overlay.style.top = `${Math.max(top, 0)}px`
      overlay.style.left = `${Math.max(left, 0)}px`
      overlay.style.transformOrigin = origin
    })
  }

  const onResizeEnd = (event) => {
    if (Array.isArray(event?.sizes) && event.sizes.length > 0) {
      editorPanelSize.value = event.sizes[0]
      panelSizes.value = [...event.sizes]
    }
  }

  const onUpdatePanelSizes = (sizes) => {
    if (Array.isArray(sizes) && sizes.length === 2) {
      panelSizes.value = [...sizes]
    }
  }

  watch(
    () => editorPanelSize.value,
    (val) => {
      const nextSize = Number(val)
      if (Number.isFinite(nextSize)) {
        panelSizes.value = [nextSize, 100 - nextSize]
      }
    }
  )

  watch(
    () => panelSizes.value,
    async () => {
      await nextTick()
      window.dispatchEvent(new Event('resize'))
    },
    { deep: true }
  )

  const runQuery = async (addToHistory = true) => {
    isLoadingQuery.value = true
    const contentToRun = selectedSqlText.value?.trim() ? selectedSqlText.value : sqlQueryText.value
    if (!contentToRun || isExecutingQuery.value) return

    isExecutingQuery.value = true
    try {
      const { results, tableNameExecuted } = await executeQuery(contentToRun, { addToHistory })
      // Adapter already filters schema based on returned rows
      resultRows.value = results[0].rows
      const schemaRows = results[results.length - 1].rows
      resultColumns.value = schemaRows.map((column) => ({
        field: column.name,
        tagType: column.type?.toLowerCase?.() ?? String(column.type || ''),
        header: column.name,
        sortable: true
      }))
      resultSchema.value = schemaRows
      activeTableName.value = tableNameExecuted
      updateListHistory()
    } finally {
      isExecutingQuery.value = false
      isLoadingQuery.value = false
    }
  }

  const reloadData = async () => {
    const query = `SELECT * FROM "${activeTableName.value}"; PRAGMA table_info("${activeTableName.value}");`
    selectedSqlText.value = query
    await runQuery(false)
    selectedSqlText.value = ''
  }

  const runHistoryQuery = async () => {
    const query = currentMenuQuery.value
    if (!query || isExecutingQuery.value) return
    isExecutingQuery.value = true
    try {
      sqlQueryText.value = query.originalQuery
      await executeQuery(query.originalQuery)
      updateListHistory()
    } finally {
      isExecutingQuery.value = false
      historyMenu.value?.hide()
    }
  }

  const deleteHistoryQuery = () => {
    const query = currentMenuQuery.value
    if (!query) return
    removeQueryFromHistory(query.id)
    updateListHistory()
    historyMenu.value?.hide()
  }

  const handleUseTemplate = (template) => {
    sqlQueryText.value = template.query
    showTemplatesModal.value = false
  }

  onMounted(async () => {
    updateListHistory()
    window.addEventListener('keydown', handleGlobalKeydown)
    window.addEventListener('selectionchange', handleSelectionChange)
    await waitForMonaco()
    registerSqlAutocomplete(tablesTreeForAutocomplete.value)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleGlobalKeydown)
    window.removeEventListener('selectionchange', handleSelectionChange)
    disposeProvider()
  })

  const prettifyCode = () => {
    const content = sqlQueryText.value || ''
    if (!content.trim()) return
    sqlQueryText.value = formatSql(content)
  }

  watch(
    () => route.params.id,
    () => {
      updateListHistory()
    }
  )

  // Autocomplete: build a light tablesTree from currentTables
  const tablesTreeForAutocomplete = computed(() => {
    const list = Array.isArray(props.listTables) ? props.listTables : []
    return list.map((table) => ({ key: table?.name || table?.key || String(table) }))
  })

  watch(
    () => tablesTreeForAutocomplete.value,
    (newVal) => {
      registerSqlAutocomplete(newVal)
    },
    { deep: true }
  )

  watch(
    () => props.showSnippetsCreateTable,
    async (newVal) => {
      if (newVal) {
        sqlQueryText.value = QUICK_TEMPLATES[0].query
        await nextTick()
        emit('update:show-snippets-create-table', false)
      }
    }
  )

  defineExpose({
    setSql: (query) => (sqlQueryText.value = query),
    run: runQuery
  })
</script>
