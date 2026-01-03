/**
 * Shared List Table Selectors
 *
 * Common selectors for data tables used across all modules.
 * Based on PrimeVue DataTable component patterns.
 *
 * IMPORTANT LEARNINGS:
 * 1. Use `.p-datatable` for reliable table detection (always present when table exists)
 * 2. Delete confirmation requires entity name/key, NOT literal "delete"
 * 3. Column selectors follow pattern: [data-testid*="list-table-block__column__<name>"]
 * 4. Actions: single button (1 action) vs menu button (multiple actions)
 */

export default {
  // Table container - PREFER .p-datatable for detection (more reliable)
  table: '[data-testid="data-table-container"]',
  dataTable: '[data-testid="data-table"]',
  tableWrapper: '.p-datatable-wrapper',
  primeTable: '.p-datatable', // Most reliable for detecting table presence

  // Search
  search: {
    container: '[data-testid="data-table-search"]',
    input: '[data-testid="data-table-search-input"]'
  },

  // Rows
  rows: {
    all: '[data-testid="list-table-block__column__name__row"]',
    row: (index) => `[data-testid="list-table-block__column__name__row"]:nth-child(${index + 1})`,
    column: (columnName) => `[data-testid="list-table-block__column__${columnName}__row"]`,
    statusTag: '.p-tag-value',
    checkbox: '.p-datatable-tbody .p-checkbox'
  },

  // Empty state
  empty: {
    container: '[data-testid="list-table-block__empty-results-block"]',
    message: '[data-testid="list-table-block__empty-message__text"]',
    createButton: '[data-testid="list-table-block__empty-results-block__create-button"]'
  },

  // Loading
  loading: {
    overlay: '.p-datatable-loading-overlay',
    skeleton: '.p-skeleton'
  },

  // Actions column
  actions: {
    menuButton: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
    singleButton: '[data-testid="data-table-actions-column-body-action-button"]',
    menuItem: (action) => `[data-testid="data-table__actions-menu-item__${action}-button"]`,
    deleteButton: '[data-testid="data-table__actions-menu-item__Delete-button"]',
    editButton: '[data-testid="data-table__actions-menu-item__Edit-button"]'
  },

  // Delete dialog
  deleteDialog: {
    container: '[data-testid="delete-dialog"]',
    confirmationInput: '[data-testid="delete-dialog-confirmation-input-field"]',
    deleteButton: '[data-testid="delete-dialog-footer-delete-button"]',
    cancelButton: '[data-testid="delete-dialog-footer-cancel-button"]'
  },

  // Pagination
  pagination: {
    container: '.p-paginator',
    rowsPerPage: '.p-paginator-rpp-options',
    rowsPerPageOption: (size) => `li.p-dropdown-item[aria-label="${size}"]`,
    page: (number) => `button.p-paginator-page[aria-label="${number}"]`,
    firstPage: '.p-paginator-first',
    prevPage: '.p-paginator-prev',
    nextPage: '.p-paginator-next',
    lastPage: '.p-paginator-last'
  },

  // Sorting
  sorting: {
    header: (columnIndex) =>
      `:nth-child(${columnIndex}) > .p-column-header-content > [data-pc-section="sort"]`,
    ascIcon: '.p-sortable-column-icon[data-sortorder="1"]',
    descIcon: '.p-sortable-column-icon[data-sortorder="-1"]'
  },

  // Column visibility toggle
  columnToggle: '[data-testid="data-table-actions-column-header-toggle-columns"]',

  // Expand/Show more
  showMore: '[data-testid="table-column-expand-text-column__show-more__toggle"]'
}
