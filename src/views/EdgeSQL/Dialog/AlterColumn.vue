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
        v-for="(tokens, index) in tokenizedQueries"
        :key="index"
        class="flex flex-col gap-2 self-stretch p-3.5 bg-[var(--surface-300)] rounded-md border surface-border justify-start items-start overflow-auto max-h-80"
      >
        <span class="block w-full whitespace-pre-wrap break-words overflow-auto">
          <template
            v-for="(part, i) in tokens"
            :key="i"
          >
            <span
              v-if="part.isKeyword"
              class="mx-1 text-color font-medium"
              >{{ part.text }}</span
            >
            <span
              v-else
              class=""
              >{{ part.text }}</span
            >
          </template>
        </span>
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
    query: { type: String, default: '' },
    tableName: { type: String, default: '' }
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
  // Tokenize query strings into keyword/non-keyword parts (no v-html)
  const KEYWORDS = [
    'CREATE',
    'ALTER',
    'TRUNCATE',
    'TABLE',
    'BEGIN',
    'PRAGMA',
    'INSERT',
    'INTO',
    'DROP',
    'RENAME',
    'ON',
    'COMMIT',
    'OFF'
  ]
  const keywordRegex = new RegExp(`\\b(${KEYWORDS.join('|')})\\b`, 'gi')

  const tokenizeSql = (input) => {
    const parts = []
    const text = String(input ?? '')
    let lastIndex = 0
    let match
    while ((match = keywordRegex.exec(text)) !== null) {
      const start = match.index
      const end = start + match[0].length
      if (start > lastIndex) {
        parts.push({ text: text.slice(lastIndex, start), isKeyword: false })
      }
      parts.push({ text: match[0], isKeyword: true })
      lastIndex = end
    }
    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex), isKeyword: false })
    }
    return parts
  }

  const tokenizedQueries = computed(() =>
    formattedQuery.value.map((queryText) => tokenizeSql(queryText))
  )
  const emit = defineEmits(['update:visible', 'load-tables'])

  const alterColumn = async () => {
    try {
      const statements = props.query
      await edgeSQLService.updateColumn(currentDatabase.value.id, {
        statements,
        tableName: props.tableName
      })
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
