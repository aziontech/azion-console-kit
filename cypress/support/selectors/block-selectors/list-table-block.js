export default {
  createDigitalCertificateButton: '[data-testid="create_Digital Certificate_button"]',
  searchInput: '[data-testid="data-table-search-input"]',
  searchField: '[data-testid="data-table-search-input"]',
  filteredRow: {
    column: (columnName) => `[data-testid="list-table-block__column__${columnName}__row"]`,
    statusColumn: '[data-testid="list-table-block__column__status__row"] > .p-tag-value',
    empty: 'tr.p-datatable-emptymessage > td',
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
  }
}
