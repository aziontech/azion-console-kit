<template>
  <div class="flex flex-col sm:flex-row mt-4 gap-8 w-full">
    <div class="flex flex-col !w-64">
      <div class="flex flex-col w-full gap-4">
        <h3 class="text-lg font-medium text-color-primary">Query History</h3>
        <div class="p-input-icon-left">
          <i class="pi pi-search" />
          <InputText
            v-model="searchTerm"
            placeholder="Search queries"
            class="w-full"
          />
        </div>

        <div class="flex-1 overflow-y-auto max-h-[calc(100svh-40%)]">
          <div
            v-if="isLoading"
            class="flex flex-col gap-3"
          >
            <div
              v-for="index in 3"
              :key="index"
              class="py-2 rounded"
            >
              <div class="flex items-center justify-between">
                <Skeleton class="h-8 w-full" />
              </div>
            </div>
          </div>
          <div
            v-else-if="!filteredHistory.length"
            class="text-left py-2"
          >
            <div class="text-color-secondary text-sm">
              {{ searchTerm ? 'No queries found.' : 'No queries created yet.' }}
            </div>
          </div>
          <div v-else>
            <div
              v-for="query in filteredHistory"
              :key="query.id"
              class="group p-2 rounded cursor-pointer hover:bg-[--table-bg-color] transition-colors"
              :class="{ 'bg-[--table-bg-color]': selectedQueryId === query.id }"
              @click="selectQuery(query)"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-color-primary truncate">{{
                  query.label
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="w-full">
      <Splitter
        :pt="{ root: { 'data-testid': 'code-editor', class: 'border-none' } }"
        layout="vertical"
        style="height: calc(100vh - 250px); width: 100%"
        @resizeend="onResizeEnd"
      >
        <SplitterPanel
          class="h-full w-full"
          :size="editorPanelSize"
          :minSize="20"
          :pt="{ root: { 'data-testid': 'code-editor__panel__editor' } }"
        >
          <div class="flex flex-col h-full">
            <div class="flex justify-between border-1 border surface-border rounded-t-md p-3">
              <Button
                label="Run Query"
                icon="pi pi-play"
                size="small"
                severity="primary"
                @click="emit('run-query', sqlQueryCommand.value)"
                v-tooltip="{
                  value: 'Run Query (⌘ ↵)',
                  pt: {
                    arrow: {
                      class: 'bg-primary text-white'
                    }
                  }
                }"
              />

              <div class="flex gap-2">
                <Button
                  label="Table Reference"
                  icon="pi pi-table"
                  size="small"
                  severity="secondary"
                  outlined
                  @click="emit('open-table-reference')"
                />
                <Button
                  label="Prettify"
                  icon="pi pi-align-left"
                  size="small"
                  outlined
                  severity="secondary"
                  @click="emit('prettify')"
                />
                <Button
                  label="Templates"
                  icon="pi pi-bolt"
                  size="small"
                  severity="secondary"
                  outlined
                  @click="emit('open-templates')"
                />
              </div>
            </div>
            <div class="flex-1 min-h-0">
              <vue-monaco-editor
                :key="`editor-${editorPanelSize}`"
                v-model:value="sqlQueryCommand"
                language="sql"
                :theme="monacoTheme"
                :options="{ ...monacoOptions, readOnly: isExecutingQuery }"
                class="w-full h-full"
              />
            </div>
          </div>
        </SplitterPanel>
        <SplitterPanel
          :size="100 - editorPanelSize"
          :minSize="20"
          :pt="{ root: { 'data-testid': 'code-editor__panel__console' } }"
        >
          <h3>Console</h3>
        </SplitterPanel>
      </Splitter>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import Splitter from 'primevue/splitter'
  import SplitterPanel from 'primevue/splitterpanel'
  import Button from 'primevue/button'
  import InputText from 'primevue/inputtext'
  import { useEdgeSQL } from './composable/useEdgeSQL'

  defineOptions({ name: 'CodeEditor' })
  const emit = defineEmits([
    'create-query',
    'run-query',
    'open-table-reference',
    'prettify',
    'open-templates'
  ])

  const sqlQueryCommand = ref('')
  const searchTerm = ref('')

  const { queryResults, isLoading } = useEdgeSQL()

  const monacoTheme = 'vs-dark'

  const monacoOptions = {}

  const isExecutingQuery = ref(false)

  const editorPanelSize = ref(70) // percentage height of editor panel

  const filteredHistory = computed(() => {
    const term = searchTerm.value.trim().toLowerCase()
    if (!term) return queryResults.value
    return queryResults.value.filter((queryItem) => {
      const label = queryItem.label?.toString().toLowerCase() || ''
      const original = queryItem.originalQuery?.toString().toLowerCase() || ''
      return label.includes(term) || original.includes(term)
    })
  })

  const selectedQueryId = ref(null)

  const selectQuery = (query) => {
    selectedQueryId.value = query.id
    sqlQueryCommand.value = query.originalQuery
  }

  const onResizeEnd = (event) => {
    // event.sizes is an array of panel sizes in percentages
    if (Array.isArray(event?.sizes) && event.sizes.length > 0) {
      editorPanelSize.value = event.sizes[0]
    }
  }
</script>
