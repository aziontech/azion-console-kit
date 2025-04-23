export default {
  createDigitalCertificateButton: '[data-testid="create_Digital Certificate_button"]',
  searchInput: '[data-testid="data-table-search-input"]',
  searchField: '[data-testid="data-table-search-input"]',
  showMore: '[data-testid="table-column-expand-text-column__show-more__toggle"]',
  filteredRow: {
    column: (columnName) => `[data-testid="list-table-block__column__${columnName}__row"]`,
    statusColumn: '.p-tag-value',
    empty: '[data-testid="list-table-block__empty-message__text"]',
    lastEditorColumn: '[data-testid="list-table-block__column__lastEditor__row"]',
    lastModifiedColumn: '[data-testid="list-table-block__column__lastModified__row"]'
  },
  actionsMenu: {
    button: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
    deleteButton: '[data-testid="data-table__actions-menu-item__Delete-button"]',
    setDefaultButton: '[data-testid="data-table__actions-menu-item__Set as default-button"]'
  },
  singleActionsMenu: {
    button: '[data-testid="data-table-actions-column-body-action-button"]'
  },
  deleteDialog: {
    confirmationInputField: '[data-testid="delete-dialog-confirmation-input-field"]',
    deleteButton: '[data-testid="delete-dialog-footer-delete-button"]'
  },
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
