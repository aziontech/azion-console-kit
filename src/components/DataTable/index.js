import DataTableComponent from './DataTable.vue'
import DataTableHeaderComponent from './DataTableHeader.vue'
import DataTableActionsComponent from './DataTableActions.vue'
import DataTableSearchComponent from './DataTableSearch.vue'
import DataTableExportComponent from './DataTableExport.vue'
import DataTableAddButtonComponent from './DataTableAddButton.vue'
import DataTableRowActionsComponent from './DataTableRowActions.vue'
import LastModifiedPopup from './LastModifiedPopup.vue'
import Column from 'primevue/column'
const DataTable = DataTableComponent

DataTable.Header = DataTableHeaderComponent
DataTable.Actions = DataTableActionsComponent
DataTable.Search = DataTableSearchComponent
DataTable.Export = DataTableExportComponent
DataTable.AddButton = DataTableAddButtonComponent
DataTable.RowActions = DataTableRowActionsComponent
DataTable.LastModifiedPopup = LastModifiedPopup
DataTable.Column = Column

DataTable.install = (app) => {
  app.component('DataTable', DataTableComponent)
  app.component('DataTableHeader', DataTableHeaderComponent)
  app.component('DataTableActions', DataTableActionsComponent)
  app.component('DataTableSearch', DataTableSearchComponent)
  app.component('DataTableExport', DataTableExportComponent)
  app.component('DataTableAddButton', DataTableAddButtonComponent)
  app.component('DataTableRowActions', DataTableRowActionsComponent)
  app.component('DataTableLastModifiedPopup', LastModifiedPopup)
  app.component('DataTableColumn', Column)
}

export default DataTable

export {
  DataTableComponent as DataTable,
  DataTableHeaderComponent as DataTableHeader,
  DataTableActionsComponent as DataTableActions,
  DataTableSearchComponent as DataTableSearch,
  DataTableExportComponent as DataTableExport,
  DataTableAddButtonComponent as DataTableAddButton,
  DataTableRowActionsComponent as DataTableRowActions,
  LastModifiedPopup as DataTableLastModifiedPopup,
  Column as DataTableColumn
}
