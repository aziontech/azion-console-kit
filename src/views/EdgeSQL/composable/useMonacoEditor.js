import { ref } from 'vue'

export function useMonacoEditor() {
  const providerDisposable = ref(null)

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

  const waitForMonaco = () =>
    new Promise((resolve) => {
      const check = () => {
        if (window.monaco && window.monaco.languages) resolve()
        else setTimeout(check, 100)
      }
      check()
    })

  const disposeProvider = () => {
    try {
      providerDisposable.value?.dispose?.()
    } catch {
      // ignore
    } finally {
      providerDisposable.value = null
    }
  }

  const registerSqlAutocomplete = (tablesTree = []) => {
    if (!window.monaco || !window.monaco.languages) return null

    disposeProvider()

    const tableNames = Array.isArray(tablesTree) ? tablesTree.map((table) => table.key) : []

    providerDisposable.value = window.monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        }

        const suggestions = []

        // 1) Tables
        tableNames.forEach((tableName) => {
          suggestions.push({
            label: tableName,
            kind: window.monaco.languages.CompletionItemKind.Class,
            insertText: tableName,
            range,
            documentation: `Table: ${tableName}`,
            detail: 'Table',
            sortText: '0' + tableName
          })
        })

        // 2) Keywords
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
            range,
            documentation: `SQL keyword: ${keyword}`,
            sortText: '1' + keyword
          })
        })

        // 3) Functions
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
            range,
            documentation: func.doc,
            detail: 'Function',
            sortText: '2' + func.name
          })
        })

        // 4) Snippets
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
            range,
            documentation: snippet.documentation,
            detail: snippet.detail,
            sortText: '3' + snippet.label
          })
        })

        return { suggestions }
      }
    })

    return providerDisposable.value
  }

  return {
    monacoOptions,
    waitForMonaco,
    registerSqlAutocomplete,
    disposeProvider
  }
}
