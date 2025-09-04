<template>
  <div
    class="mb-3 border-1 surface-border overflow-hidden rounded-md"
    style="height: 250px"
  >
    <div
      class="h-10 border-bottom-1 surface-border flex justify-content-between align-items-center p-2"
    >
      <span class="text-color">Query Editor</span>
      <i class="pi pi-align-left text-color"></i>
    </div>
    <vue-monaco-editor
      v-model:value="sqlQueryCommand"
      language="sql"
      :theme="monacoTheme"
      :options="{ ...monacoOptions, readOnly: isExecutingQuery }"
      class="w-full h-full"
    />
  </div>
  <div class="flex justify-content-between align-items-center">
    <div class="flex align-items-center gap-3 text-sm text-color-secondary py-1">
      <div
        v-if="getQueryStats?.duration"
        class="flex align-items-center gap-1"
      >
        <i class="pi pi-clock text-xs"></i>
        <span>{{ getQueryStats?.duration }}ms</span>
      </div>

      <div
        v-else-if="executionTime > 0"
        class="flex align-items-center gap-1"
      >
        <i class="pi pi-clock text-xs"></i>
        <span>{{ executionTime }}ms</span>
      </div>

      <div
        v-if="getQueryStats?.rowsRead !== undefined"
        class="flex align-items-center gap-1"
      >
        <i class="pi pi-eye text-xs"></i>
        <span>{{ getQueryStats?.rowsRead }} read</span>
      </div>
      <div
        v-if="getQueryStats?.rowsWritten !== undefined"
        class="flex align-items-center gap-1"
      >
        <i class="pi pi-pencil text-xs"></i>
        <span>{{ getQueryStats?.rowsWritten }} written</span>
      </div>
    </div>
    <div class="flex align-items-center gap-3">
      <Button
        label="Clear"
        icon="pi pi-times-circle"
        severity="secondary"
        outlined
        @click="sqlQueryCommand = ''"
        :disabled="isExecutingQuery"
      />
      <Button
        :label="label"
        :icon="icon"
        severity="secondary"
        :loading="isExecutingQuery"
        @click="executeQuery"
        :disabled="!sqlQuery.trim() || isExecutingQuery"
        class="font-medium"
        v-tooltip.top="'Run Query (Ctrl+Enter)'"
      />
    </div>
  </div>
</template>

<script setup>
  defineOptions({ name: 'query-editor-block' })
  import { computed, ref, watch } from 'vue'
  import Button from 'primevue/button'

  const emit = defineEmits(['execute-query'])

  const props = defineProps({
    queryResults: {
      type: Array,
      default: () => []
    },
    executionTime: {
      type: Number,
      default: 0
    },
    isExecutingQuery: {
      type: Boolean,
      default: false
    },
    monacoTheme: {
      type: String,
      default: 'vs'
    },
    sqlQuery: {
      type: String,
      default: ''
    }
  })

  const sqlQueryCommand = ref(props.sqlQuery)

  const executeQuery = () => {
    emit('execute-query', sqlQueryCommand.value)
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

  const label = computed(() => {
    if (props.isExecutingQuery) return 'Executing...'
    return 'Run Query'
  })

  const icon = computed(() => {
    if (props.isExecutingQuery) return 'pi pi-spin pi-spinner'
    return 'pi pi-arrow-circle-right'
  })

  const getQueryStats = computed(() => {
    if (!props.queryResults || props.queryResults.length === 0) return null

    const stats = props.queryResults.reduce(
      (acc, result) => {
        if (result.queryDurationMs) {
          acc.duration += result.queryDurationMs
        }
        if (result.rowsRead) {
          acc.rowsRead += result.rowsRead
        }
        if (result.rowsWritten) {
          acc.rowsWritten += result.rowsWritten
        }
        return acc
      },
      { duration: 0, rowsRead: 0, rowsWritten: 0 }
    )

    return stats
  })

  watch(
    () => props.sqlQuery,
    (newQuery) => {
      sqlQueryCommand.value = newQuery
    }
  )
</script>
