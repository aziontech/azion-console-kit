import { ref } from 'vue'
import { defaultColumnMapper } from '@/views/RealTimeEvents/Blocks/constants/tabs-events'
import { triggerBlobDownload } from '@/views/RealTimeEvents/helpers/trigger-download'

/**
 * Composable for table data export (CSV and JSON).
 *
 * Extracted from tab-panel-block.vue to keep the component thin.
 *
 * @param {Object} options
 * @param {import('vue').Ref<Array>}        options.tableData     – reactive table rows
 * @param {import('vue').ComputedRef<Object>} options.tabSelected – current tab/dataset config
 */
export function useExportData({ tableData, tabSelected }) {
  const dataTableRef = ref(null)
  const exportMenuRef = ref(null)

  const toggleExportMenu = (event) => exportMenuRef.value?.toggle(event)

  const exportMenuItems = ref([
    {
      label: 'Export as CSV',
      icon: 'pi pi-file',
      command: () => dataTableRef.value?.exportCSV?.()
    },
    {
      label: 'Export as JSON',
      icon: 'pi pi-code',
      command: () => {
        if (!tableData.value.length) return
        const blob = new Blob([JSON.stringify(tableData.value, null, 2)], {
          type: 'application/json'
        })
        const url = URL.createObjectURL(blob)
        triggerBlobDownload({
          url,
          filename: `${tabSelected.value?.dataset || 'events'}-export.json`
        })
      }
    }
  ])

  const exportFunctionMapper = (rowData) => {
    const mappedRow = defaultColumnMapper(rowData)
    if (rowData.field === 'summary') {
      mappedRow.summary = [...mappedRow.summary]
        .map(
          (summaryItem) => `${summaryItem.key}: ${String(summaryItem.value).replace(/"/g, '""')}`
        )
        .join(' | ')
    }
    return mappedRow[rowData.field] ?? ''
  }

  return {
    dataTableRef,
    exportMenuRef,
    toggleExportMenu,
    exportMenuItems,
    exportFunctionMapper
  }
}
