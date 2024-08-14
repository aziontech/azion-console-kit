/**
 * Returns the csv cell content based on the custom column mapper and the row data.
 *
 * @param {Object} params - The parameters to get the csv cell content.
 * @param {Object.<string, Object>} params.columnMapper - Object with each custom column as key and the mapper function for that column as value.
 * @param {import('primevue/datatable').DataTableExportFunctionOptions} params.rowData - The row data from the data table.
 * @return {string} The csv cell content.
 *
 * @example
 * const columnMapper = {
 *  field1: rowData.data.content,
 *  field2: rowData.data.text,
 *  field3: rowData.data.value,
 *  field4: rowData.data
 * }
 */
export const getCsvCellContentFromRowData = ({ columnMapper, rowData }) => {
  return columnMapper[rowData.field] || rowData.data
}
