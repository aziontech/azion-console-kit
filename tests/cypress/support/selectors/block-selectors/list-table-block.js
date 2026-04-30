export default {
  // Container & table
  container: '[data-testid="data-table-container"]',
  dataTable: '[data-testid="data-table"]',
  header: '[data-testid="data-table-header"]',

  // Search - the span wrapper contains DataTable.Search which renders an input
  searchArea: '[data-testid="data-table-search"]',
  searchInput: '[data-testid="data-table-search"] input',

  // Header actions
  toggleFilter: '[data-testid="data-table-actions-column-header-toggle-filter"]',
  refreshButton: '[data-testid="data-table-actions-column-header-refresh"]',

  // Create button (dynamic per module - use createButton helper)
  createButton: (moduleName) =>
    `[data-testid="create_${moduleName}_button"] > button:last-of-type`,

  // Show more for expanded text columns
  showMore: '[data-testid="table-column-expand-text-column__show-more__toggle"]',

  // Row data
  filteredRow: {
    column: (columnName) => `[data-testid="list-table-block__column__${columnName}__row"]`,
    statusColumn: '.p-tag-value',
    empty: '[data-testid="list-table-block__empty-message__text"]',
    lastEditorColumn: '[data-testid="list-table-block__column__lastEditor__row"]',
    lastModifiedColumn: '[data-testid="list-table-block__column__lastModified__row"]'
  },

  // Row actions menu
  actionsMenu: {
    column: '[data-testid="data-table-actions-column"]',
    button: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
    menuItem: (label) => `[role="menuitem"]:contains("${label}")`,
    deleteButton: '[role="menuitem"]:contains("Delete")'
  },

  // "Other Actions" button (in header area, next to create)
  otherActionsButton: '[data-testid="data-table-other-actions-button"]',

  // Delete dialog
  deleteDialog: {
    dialog: '[data-testid="delete-dialog"]',
    content: '[data-testid="delete-dialog-content"]',
    warning: '[data-testid="delete-dialog-warning"]',
    warningMessage: '[data-testid="delete-dialog-warning-message"]',
    confirmationInputField: '[data-testid="delete-dialog-confirmation-input-field"]',
    confirmationError: '[data-testid="delete-dialog-confirmation-input-error"]',
    deleteButton: '[data-testid="delete-dialog-footer-delete-button"]',
    cancelButton: '[data-testid="delete-dialog-footer-cancel-button"]'
  },

  // Pagination
  rowsPerPage: {
    dropdown: '.p-paginator-rpp-options',
    option: (size) => `li.p-dropdown-item[aria-label="${size}"]`
  },
  pageNumber: {
    option: (page) => `button.p-paginator-page[aria-label="${page}"]`
  },
  orderingHeader: {
    firstColumn: ':nth-child(1) > .p-column-header-content > [data-pc-section="sort"] > .p-icon'
  }
}
