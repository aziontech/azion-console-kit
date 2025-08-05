export default {
  // List actions
  createButton: '[data-testid="create_Database_button"]',
  searchInput: '[data-testid="data-table-search-input"]',
  
  // Form fields
  nameInput: '[data-testid="database-name-field"] input',
  
  // Database interface
  queryEditor: '.sql-editor-container textarea, .monaco-editor textarea',
  executeButton: 'button:contains("Execute Query")',
  clearButton: 'button:contains("Clear")',
  backButton: 'button:contains("Back to Databases")',
  
  // Templates
  templatesSection: '.templates-section',
  templateButton: (templateName) => `[data-testid="template-${templateName}"]`,
  
  // Results
  resultsTab: '.results-tabs button:contains("Results")',
  historyTab: '.results-tabs button:contains("History")',
  queryResults: '[data-testid*="result"]',
  
  // Sidebar
  tablesSection: '.database-sidebar',
  tableItem: (tableName) => `[data-testid="table-${tableName}"]`,
  
  // List columns and actions
  list: {
    nameColumn: '[data-testid="list-table-block__column__name__row"]',
    statusColumn: '[data-testid="list-table-block__column__status__row"]',
    firstRow: '[data-testid="list-table-block"] tbody tr:first-child',
    actionsButton: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
    deleteButton: '[data-testid="data-table__actions-menu-item__Delete-button"]'
  }
}