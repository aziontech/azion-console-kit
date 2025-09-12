<template>
  <div
    class="mb-3 border-1 surface-border overflow-hidden rounded-md"
    style="height: 250px"
  >
    <div
      class="h-10 border-bottom-1 surface-border flex justify-content-between align-items-center p-2"
    >
      <span class="text-color text-sm p-2">Query Editor</span>
    </div>
    <vue-monaco-editor
      v-model:value="sqlQueryCommand"
      language="sql"
      :theme="monacoTheme"
      :options="{ ...monacoOptions, readOnly: isExecutingQuery }"
      class="w-full h-full"
    />
  </div>
  <div
    class="flex flex-col sm:flex-row justify-content-between sm:align-items-center align-items-start flex-wrap gap-2"
  >
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
    <div class="flex align-items-center gap-3 justify-end">
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
  import { computed, ref, watch, onMounted } from 'vue'
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
    },
    tableNames: {
      type: Array,
      default: () => []
    },
    columnNames: {
      type: Array,
      default: () => []
    },
    tablesTree: {
      type: Array,
      default: () => []
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
    padding: { top: 10, bottom: 10 },
    suggest: {
      showKeywords: true,
      showSnippets: true,
      showFunctions: true,
      showWords: true,
      showClasses: true,
      showStructs: true,
      showInterfaces: true,
      showModules: true,
      showProperties: true,
      showEvents: true,
      showOperators: true,
      showUnits: true,
      showValues: true,
      showConstants: true,
      showEnums: true,
      showEnumMembers: true,
      showColors: true,
      showFiles: true,
      showReferences: true,
      showFolders: true,
      showTypeParameters: true,
      showUsers: true,
      showIssues: true
    },
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false
    },
    acceptSuggestionOnCommitCharacter: true,
    acceptSuggestionOnEnter: 'on',
    wordBasedSuggestions: true
  }

  const setupAutoComplete = () => {
    if (!window.monaco || !window.monaco.languages) {
      // eslint-disable-next-line no-console
      console.warn('Monaco Editor not loaded yet')
      return
    }

    window.monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        }

        const suggestions = []
        const tableNames = props.tablesTree.map((table) => table.key)

        // Table names from tablesTree (FIRST PRIORITY)
        tableNames.forEach((tableName) => {
          suggestions.push({
            label: tableName,
            kind: window.monaco.languages.CompletionItemKind.Class,
            insertText: tableName,
            range: range,
            documentation: `Table: ${tableName}`,
            detail: 'Table',
            sortText: '0' + tableName
          })
        })

        // SQL Keywords (SECOND PRIORITY)
        const sqlKeywords = [
          'SELECT',
          'FROM',
          'WHERE',
          'INSERT',
          'UPDATE',
          'DELETE',
          'CREATE',
          'DROP',
          'ALTER',
          'TABLE',
          'INDEX',
          'VIEW',
          'DATABASE',
          'SCHEMA',
          'FUNCTION',
          'PROCEDURE',
          'TRIGGER',
          'JOIN',
          'INNER',
          'LEFT',
          'RIGHT',
          'FULL',
          'OUTER',
          'ON',
          'AS',
          'AND',
          'OR',
          'NOT',
          'NULL',
          'IS',
          'IN',
          'BETWEEN',
          'LIKE',
          'EXISTS',
          'HAVING',
          'GROUP',
          'ORDER',
          'BY',
          'ASC',
          'DESC',
          'LIMIT',
          'OFFSET',
          'UNION',
          'ALL',
          'DISTINCT',
          'COUNT',
          'SUM',
          'AVG',
          'MIN',
          'MAX',
          'CASE',
          'WHEN',
          'THEN',
          'ELSE',
          'END',
          'IF',
          'COALESCE',
          'NULLIF'
        ]

        sqlKeywords.forEach((keyword) => {
          suggestions.push({
            label: keyword,
            kind: window.monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range: range,
            documentation: `SQL keyword: ${keyword}`,
            sortText: '1' + keyword
          })
        })

        // SQL Functions
        const sqlFunctions = [
          { name: 'COUNT', snippet: 'COUNT(${1:column})', doc: 'Count rows' },
          { name: 'SUM', snippet: 'SUM(${1:column})', doc: 'Sum values' },
          { name: 'AVG', snippet: 'AVG(${1:column})', doc: 'Average values' },
          { name: 'MIN', snippet: 'MIN(${1:column})', doc: 'Minimum value' },
          { name: 'MAX', snippet: 'MAX(${1:column})', doc: 'Maximum value' },
          { name: 'UPPER', snippet: 'UPPER(${1:column})', doc: 'Convert to uppercase' },
          { name: 'LOWER', snippet: 'LOWER(${1:column})', doc: 'Convert to lowercase' },
          { name: 'LENGTH', snippet: 'LENGTH(${1:column})', doc: 'String length' },
          {
            name: 'SUBSTR',
            snippet: 'SUBSTR(${1:column}, ${2:start}, ${3:length})',
            doc: 'Substring'
          },
          { name: 'TRIM', snippet: 'TRIM(${1:column})', doc: 'Remove whitespace' },
          {
            name: 'REPLACE',
            snippet: 'REPLACE(${1:column}, ${2:old}, ${3:new})',
            doc: 'Replace text'
          },
          {
            name: 'CONCAT',
            snippet: 'CONCAT(${1:column1}, ${2:column2})',
            doc: 'Concatenate strings'
          },
          { name: 'ROUND', snippet: 'ROUND(${1:column}, ${2:decimals})', doc: 'Round number' },
          { name: 'ABS', snippet: 'ABS(${1:column})', doc: 'Absolute value' },
          {
            name: 'COALESCE',
            snippet: 'COALESCE(${1:column}, ${2:default})',
            doc: 'Return first non-null value'
          },
          {
            name: 'NULLIF',
            snippet: 'NULLIF(${1:column}, ${2:value})',
            doc: 'Return null if values are equal'
          },
          {
            name: 'CASE',
            snippet: 'CASE WHEN ${1:condition} THEN ${2:value} ELSE ${3:default} END',
            doc: 'Conditional expression'
          },
          { name: 'DATETIME', snippet: 'DATETIME(${1:timestring})', doc: 'Parse datetime' },
          { name: 'DATE', snippet: 'DATE(${1:timestring})', doc: 'Parse date' },
          { name: 'TIME', snippet: 'TIME(${1:timestring})', doc: 'Parse time' },
          {
            name: 'STRFTIME',
            snippet: 'STRFTIME(${1:format}, ${2:timestring})',
            doc: 'Format datetime'
          }
        ]

        sqlFunctions.forEach((func) => {
          suggestions.push({
            label: func.name,
            kind: window.monaco.languages.CompletionItemKind.Function,
            insertText: func.snippet,
            insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            documentation: func.doc,
            detail: 'Function',
            sortText: '2' + func.name
          })
        })

        // Common SQL snippets
        const snippets = [
          {
            label: 'select-from',
            insertText: 'SELECT ${1:columns}\nFROM ${2:table}\nWHERE ${3:condition};',
            documentation: 'Basic SELECT statement',
            detail: 'Snippet'
          },
          {
            label: 'insert-into',
            insertText: 'INSERT INTO ${1:table} (${2:columns})\nVALUES (${3:values});',
            documentation: 'INSERT statement',
            detail: 'Snippet'
          },
          {
            label: 'update-set',
            insertText: 'UPDATE ${1:table}\nSET ${2:column} = ${3:value}\nWHERE ${4:condition};',
            documentation: 'UPDATE statement',
            detail: 'Snippet'
          },
          {
            label: 'delete-from',
            insertText: 'DELETE FROM ${1:table}\nWHERE ${2:condition};',
            documentation: 'DELETE statement',
            detail: 'Snippet'
          },
          {
            label: 'create-table',
            insertText:
              'CREATE TABLE ${1:table_name} (\n  ${2:column_name} ${3:data_type},\n  ${4:column_name} ${5:data_type}\n);',
            documentation: 'CREATE TABLE statement',
            detail: 'Snippet'
          },
          {
            label: 'inner-join',
            insertText: 'INNER JOIN ${1:table} ON ${2:condition}',
            documentation: 'INNER JOIN clause',
            detail: 'Snippet'
          },
          {
            label: 'left-join',
            insertText: 'LEFT JOIN ${1:table} ON ${2:condition}',
            documentation: 'LEFT JOIN clause',
            detail: 'Snippet'
          }
        ]

        snippets.forEach((snippet) => {
          suggestions.push({
            label: snippet.label,
            kind: window.monaco.languages.CompletionItemKind.Snippet,
            insertText: snippet.insertText,
            insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            documentation: snippet.documentation,
            detail: snippet.detail,
            sortText: '3' + snippet.label
          })
        })
        return { suggestions }
      }
    })
  }

  onMounted(() => {
    const checkMonaco = () => {
      if (window.monaco && window.monaco.languages) {
        setupAutoComplete()
      } else {
        setTimeout(checkMonaco, 100)
      }
    }
    checkMonaco()
  })

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

  watch(
    [() => props.tablesTree],
    () => {
      if (window.monaco && window.monaco.languages) {
        setupAutoComplete()
      }
    },
    { deep: true }
  )
</script>
