export default {

  createButton: '[data-testid="create_Database_button"]',
  searchInput: '[data-testid="data-table-search-input"]',
  nameInput: '[data-testid="database-name-field"] input, [name="name"]',
  queryEditor: '[data-testid="sql-query-editor"], .sql-editor-container textarea, .monaco-editor textarea',
  executeButton: '[data-testid="execute-query-button"], button:contains("Execute Query")',
  clearButton: '[data-testid="clear-query-button"], button:contains("Clear")',
  backButton: '[data-testid="back-to-databases-button"], button:contains("Back to Databases")',
  templatesSection: '.templates-section',
  templateButton: (templateName) => `[data-testid="template-${templateName}"]`,
  resultsTab: '[data-testid="results-tab"], .results-tabs button:contains("Results")',
  historyTab: '[data-testid="history-tab"], .results-tabs button:contains("History")',
  queryResults: '[data-testid*="result"]',
  errorMessage: '[data-testid="query-error"], .error-message',
  loadingSpinner: '[data-testid="query-loading"], .pi-spin',
  resultsTable: '[data-testid="results-data-table"]',
  resultsRows: '[data-testid="results-data-table"] tbody tr',
  noResultsMessage: '[data-testid="no-results-message"]',
  tablesSection: '[data-testid="database-sidebar"], .database-sidebar',
  tableItem: (tableName) => `[data-testid="table-${tableName}"]`,
  refreshTablesButton: '[data-testid="refresh-tables-button"]',
  list: {
    nameColumn: '[data-testid="list-table-block__column__name__row"]',
    statusColumn: '[data-testid="list-table-block__column__status__row"]',
    firstRow: '[data-testid="list-table-block"] tbody tr:first-child',
    actionsButton: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
    deleteButton: '[data-testid="data-table__actions-menu-item__Delete-button"]'
  }
}