<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">SQL Query Editor</h3>
      <div class="flex items-center gap-2">
        <Button
          :icon="isEditorCollapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up'"
          @click="toggleEditor"
          text
          size="small"
          v-tooltip.top="isEditorCollapsed ? 'Expand Editor' : 'Collapse Editor'"
        />
        <Button
          icon="pi pi-play"
          @click="executeQuery"
          :loading="isExecutingQuery"
          :disabled="!sqlQuery.trim()"
          label="Execute"
          size="small"
        />
      </div>
    </div>

    <div v-show="!isEditorCollapsed" class="flex flex-col gap-2">
      <textarea
        v-model="sqlQuery"
        class="w-full h-32 p-3 border border-surface-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
        placeholder="Enter your SQL query here..."
        data-testid="sql-query-editor"
      />
      
      <div class="flex items-center gap-4 text-sm text-surface-600">
        <span>Execution time: {{ executionTime }}ms</span>
        <span v-if="affectedRows > 0">Affected rows: {{ affectedRows }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Button from 'primevue/button'

const props = defineProps({
  isExecutingQuery: {
    type: Boolean,
    default: false
  },
  executionTime: {
    type: Number,
    default: 0
  },
  affectedRows: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['execute-query', 'update:sqlQuery'])

const isEditorCollapsed = ref(true)

const sqlQuery = computed({
  get: () => props.sqlQuery || '',
  set: (value) => emit('update:sqlQuery', value)
})

const toggleEditor = () => {
  isEditorCollapsed.value = !isEditorCollapsed.value
}

const executeQuery = () => {
  emit('execute-query')
}
</script> 