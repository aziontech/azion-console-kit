import { h } from 'vue'
import { columnBuilder } from '@/components/list-table/columns/column-builder'

const SCOPE_TYPE_LABELS = {
  global: 'Global',
  environment: 'Environment',
  deployment: 'Deployment',
  resource: 'Resource'
}

const capitalize = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : '—')

const formatScope = (scope) => {
  if (!Array.isArray(scope) || !scope.length) return '—'
  const labels = scope.map((item) => SCOPE_TYPE_LABELS[item?.type] ?? capitalize(item?.type))
  return [...new Set(labels)].join(', ')
}

export const getVariablesV6Columns = () => {
  const keyColumn = {
    field: 'key',
    header: 'Key',
    sortField: 'key',
    headerStyle: ''
  }
  const valueColumn = {
    field: 'value',
    header: 'Value',
    type: 'component',
    sortField: 'value',
    filterPath: 'value.content',
    style: 'max-width: 300px',
    component: (columnData) => {
      if (columnData.isSecret) {
        return h('span', `${columnData.content}`)
      } else {
        return columnBuilder({
          data: columnData.content,
          columnAppearance: 'text-format-with-popup',
          dependencies: {
            showCopy: true
          }
        })
      }
    }
  }
  const scopeColumn = {
    field: 'scope',
    header: 'Scope',
    type: 'component',
    disableSort: true,
    component: (data) => h('span', { 'data-testid': 'variables-list__scope' }, formatScope(data))
  }
  const lastEditorColumn = {
    field: 'lastEditor',
    header: 'Last Editor',
    sortField: 'last_editor',
    filterPath: 'last_editor'
  }
  const lastModifiedColumn = {
    field: 'lastModified',
    header: 'Last Modified',
    sortField: 'last_modified',
    filterPath: 'lastModified'
  }

  return [keyColumn, valueColumn, scopeColumn, lastEditorColumn, lastModifiedColumn]
}
