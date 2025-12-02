import DataTableComponent from './DataTable.vue'
import DataTableHeaderComponent from './DataTableHeader.vue'
import DataTableActionsComponent from './DataTableActions.vue'
import DataTableSearchComponent from './DataTableSearch.vue'
import DataTableExportComponent from './DataTableExport.vue'
import DataTableActionsButtonsComponent from './DataTableActionsButtons.vue'
import DataTableRowActionsComponent from './DataTableRowActions.vue'
import DataTableColumnSelectorComponent from './DataTableColumnSelector.vue'
import DataTableFilterComponent from './DataTableFilter.vue'
import DataTableAppliedFiltersComponent from './DataTableAppliedFilters.vue'
import LastModifiedPopup from './LastModifiedPopup.vue'
import DataTableLastModifiedCellComponent from './DataTableLastModifiedCell.vue'
import Column from 'primevue/column'
const DataTable = DataTableComponent

DataTable.Header = DataTableHeaderComponent
DataTable.Actions = DataTableActionsComponent
DataTable.Search = DataTableSearchComponent
DataTable.Export = DataTableExportComponent
DataTable.ActionsButtons = DataTableActionsButtonsComponent
DataTable.RowActions = DataTableRowActionsComponent
DataTable.ColumnSelector = DataTableColumnSelectorComponent
DataTable.Filter = DataTableFilterComponent
DataTable.AppliedFilters = DataTableAppliedFiltersComponent
DataTable.LastModifiedPopup = LastModifiedPopup
DataTable.LastModifiedCell = DataTableLastModifiedCellComponent
DataTable.Column = Column

DataTable.install = (app) => {
  app.component('DataTable', DataTableComponent)
  app.component('DataTableHeader', DataTableHeaderComponent)
  app.component('DataTableActions', DataTableActionsComponent)
  app.component('DataTableSearch', DataTableSearchComponent)
  app.component('DataTableExport', DataTableExportComponent)
  app.component('DataTableActionsButtons', DataTableActionsButtonsComponent)
  app.component('DataTableRowActions', DataTableRowActionsComponent)
  app.component('DataTableColumnSelector', DataTableColumnSelectorComponent)
  app.component('DataTableFilter', DataTableFilterComponent)
  app.component('DataTableAppliedFilters', DataTableAppliedFiltersComponent)
  app.component('DataTableLastModifiedPopup', LastModifiedPopup)
  app.component('DataTableLastModifiedCell', DataTableLastModifiedCellComponent)
  app.component('DataTableColumn', Column)
}

export default DataTable

export {
  DataTableComponent as DataTable,
  DataTableHeaderComponent as DataTableHeader,
  DataTableActionsComponent as DataTableActions,
  DataTableSearchComponent as DataTableSearch,
  DataTableExportComponent as DataTableExport,
  DataTableActionsButtonsComponent as DataTableActionsButtons,
  DataTableRowActionsComponent as DataTableRowActions,
  DataTableColumnSelectorComponent as DataTableColumnSelector,
  DataTableFilterComponent as DataTableFilter,
  DataTableAppliedFiltersComponent as DataTableAppliedFilters,
  LastModifiedPopup as DataTableLastModifiedPopup,
  DataTableLastModifiedCellComponent as DataTableLastModifiedCell,
  Column as DataTableColumn
}
