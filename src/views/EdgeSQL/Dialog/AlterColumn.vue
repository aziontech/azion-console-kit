<template>
  <Dialog
    :visible="visible"
    @update:visible="(v) => emit('update:visible', v)"
    modal
    header="Confirm Change"
    :style="{ width: '36rem' }"
    :pt="{ header: { class: 'text-color-primary' } }"
  >
    <div class="flex flex-col gap-4">
      <InlineMessage
        severity="warn"
        v-if="formattedQuery.length > 1"
      >
        This action is not reversible. Please be certain.
      </InlineMessage>
      <p
        class="text-color-secondary text-sm font-normal"
        v-if="formattedQuery.length > 1"
      >
        Changing the data type will create a new table. Review the query below to ensure it meets
        your requirements.
      </p>
      <div
        v-for="(query, index) in highlightedQueries"
        :key="index"
        class="flex flex-col gap-2 self-stretch p-3.5 bg-[var(--surface-300)] rounded-md border surface-border justify-start items-start overflow-auto max-h-80"
      >
        <pre
          class="w-full whitespace-pre-wrap break-words overflow-auto"
          v-html="query"
        ></pre>
      </div>

      <div class="flex justify-end gap-2 mt-2">
        <PrimeButton
          label="Cancel"
          outlined
          size="small"
          @click="emit('update:visible', false)"
        />
        <PrimeButton
          label="Confirm"
          size="small"
          severity="secondary"
          @click="alterColumn"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup>
  import Dialog from 'primevue/dialog'
  import PrimeButton from 'primevue/button'
  import { edgeSQLService } from '@/services/v2/edge-sql/edge-sql-service'
  import { useToast } from 'primevue/usetoast'
  import { capitalizeFirstLetter } from '@/helpers'
  import { useEdgeSQL } from '../composable/useEdgeSQL'
  import { useSqlFormatter } from '../composable/useSqlFormatter'
  import { computed } from 'vue'
  import InlineMessage from 'primevue/inlinemessage'

  const toast = useToast()
  const { formatSql } = useSqlFormatter()

  const props = defineProps({
    visible: { type: Boolean, default: false },
    query: { type: String, default: '' }
  })

  const { currentDatabase } = useEdgeSQL()

  const showToast = (severity, detail) => {
    if (!detail) return
    const options = {
      closable: true,
      severity,
      summary: capitalizeFirstLetter(severity),
      detail
    }

    toast.add(options)
  }

  const formattedQuery = computed(() => {
    const formatted = formatSql(props.query) || ''
    return formatted
      .split(';')
      .map((segment) => segment.trim())
      .map((segment) => segment.replace(/^\s*,\s*/, ''))
      .filter((segment) => segment.length > 0)
  })
  const escapeHtml = (text) =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  const highlightSql = (text) => {
    const keywords = [
      // DDL/DML
      'SELECT',
      'INSERT',
      'UPDATE',
      'DELETE',
      'CREATE',
      'ALTER',
      'DROP',
      'RENAME',
      'TRUNCATE',
      // Clauses
      'TABLE',
      'FROM',
      'WHERE',
      'VALUES',
      'INTO',
      'BEGIN',
      'COMMIT',
      'PRAGMA',
      'TO',
      'ON',
      'IF',
      'EXISTS',
      // Constraints
      'ADD',
      'COLUMN',
      'PRIMARY',
      'KEY',
      'CONSTRAINT',
      'FOREIGN',
      'REFERENCES',
      'INDEX',
      'UNIQUE',
      // Types (common)
      'INTEGER',
      'TEXT',
      'REAL',
      'BLOB',
      'BOOLEAN',
      'VARCHAR',
      'DATETIME',
      'DATE',
      // Functions/keywords
      'CURRENT_TIMESTAMP',
      'NOW',
      'NULL',
      'DEFAULT'
    ]
    const pattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi')
    return text.replace(
      pattern,
      (matchText) => `<span class="sql-keyword">${matchText.toUpperCase()}</span>`
    )
  }
  const highlightedQueries = computed(() =>
    formattedQuery.value.map((segmentText) => highlightSql(escapeHtml(segmentText)))
  )
  const emit = defineEmits(['update:visible', 'load-tables'])

  const alterColumn = async () => {
    try {
      const statements = props.query
      await edgeSQLService.updateColumn(currentDatabase.value.id, { statements })
      showToast('success', `Altered column.`)
      emit('load-tables')
    } catch (error) {
      const message = error?.message || error
      if (error && typeof error.showErrors === 'function') error.showErrors(toast)
      else showToast('error', message)
    } finally {
      emit('update:visible', false)
    }
  }
</script>

<style scoped>
  :deep(.sql-keyword) {
    color: var(--primary-color) !important;
    font-weight: 600;
    background: color-mix(in srgb, var(--primary-color) 12%, transparent);
    padding: 0 0.125rem;
    border-radius: 2px;
  }
</style>
