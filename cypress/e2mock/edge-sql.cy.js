// cypress/e2mock/edge-sql.cy.js
import selectors from '../support/selectors'
import generateUniqueName from '../support/utils'

let databaseName

describe('Edge SQL spec', { tags: ['@dev4'] }, () => {
  beforeEach(() => {
    databaseName = generateUniqueName('EdgeSQL-DB')
    cy.login()
  })

  it('should successfully create and manage Edge SQL database with mocked APIs', () => {
    // Arrange - Set up API intercepts with mock data
    
    // Mock databases list (empty initially)
    cy.intercept('GET', '/v4/edge_sql/databases*', {
      body: {
        results: [],
        count: 0
      },
      statusCode: 200
    }).as('getDatabasesEmpty')

    // Mock database creation
    cy.intercept('POST', '/v4/edge_sql/databases', {
      body: {
        id: 123,
        name: databaseName,
        status: 'creating',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      statusCode: 201
    }).as('createDatabase')

    // Mock databases list after creation
    cy.intercept('GET', '/v4/edge_sql/databases*', {
      fixture: 'edge-sql/databases-list.json'
    }).as('getDatabasesWithData')

    // Open Edge SQL product
    cy.openProduct('Edge SQL')
    cy.wait('@getDatabasesEmpty', { timeout: 30000 })

    // Act - Create new database
    cy.get(selectors.edgeSQL.createButton).click()
    
    // Fill form
    cy.get(selectors.edgeSQL.nameInput).clear()
    cy.get(selectors.edgeSQL.nameInput).type(databaseName)
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert creation
    cy.wait('@createDatabase')
    cy.verifyToast('success', 'Database has been created')

    // Mock updated list and verify
    cy.wait('@getDatabasesWithData')
    cy.get(selectors.edgeSQL.list.nameColumn).should('contain', databaseName)
    cy.get(selectors.edgeSQL.list.statusColumn).should('contain', 'Ready')
  })

  it('should navigate to database interface and execute queries with mocked APIs', () => {
    // Arrange - Mock database interface APIs
    
    // Mock databases list
    cy.intercept('GET', '/v4/edge_sql/databases*', {
      fixture: 'edge-sql/databases-list.json'
    }).as('getDatabases')

    // Mock specific database info
    cy.intercept('GET', '/v4/edge_sql/databases/123', {
      body: {
        id: 123,
        name: 'test-database',
        status: 'created',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    }).as('getDatabase')

    // Mock tables list
    cy.intercept('GET', '/v4/edge_sql/databases/*/tables*', {
      fixture: 'edge-sql/database-tables.json'
    }).as('getTables')

    // Mock query execution
    cy.intercept('POST', '/v4/edge_sql/databases/*/query', {
      fixture: 'edge-sql/query-results.json'
    }).as('executeQuery')

    // Open Edge SQL and navigate to database
    cy.openProduct('Edge SQL')
    cy.wait('@getDatabases')
    
    // Click on database to open interface
    cy.get(selectors.edgeSQL.list.firstRow).click()
    cy.wait('@getDatabase')
    cy.wait('@getTables')

    // Assert interface is loaded
    cy.get('[data-testid="edge-sql-database-content-block"]').should('exist')
    cy.get('.sql-interface').should('exist')

    // Act - Execute a query
    cy.get('.p-accordion-header').contains('Query Editor').click()
    cy.get(selectors.edgeSQL.queryEditor).clear()
    cy.get(selectors.edgeSQL.queryEditor).type('SELECT 1 as test_column;')
    cy.get(selectors.edgeSQL.executeButton).click()

    // Assert query results
    cy.wait('@executeQuery')
    cy.verifyToast('success', 'Query executed in 15ms')
    
    // Verify results are displayed
    cy.get(selectors.edgeSQL.resultsTab).should('be.visible')
  })

  it('should handle database deletion with mocked APIs', () => {
    // Arrange - Mock APIs for deletion flow
    
    // Mock databases list
    cy.intercept('GET', '/v4/edge_sql/databases*', {
      fixture: 'edge-sql/databases-list.json'
    }).as('getDatabases')

    // Mock database deletion
    cy.intercept('DELETE', '/v4/edge_sql/databases/*', {
      statusCode: 204
    }).as('deleteDatabase')

    // Mock empty list after deletion
    cy.intercept('GET', '/v4/edge_sql/databases*', {
      body: {
        results: [],
        count: 0
      }
    }).as('getDatabasesAfterDelete')

    // Open Edge SQL
    cy.openProduct('Edge SQL')
    cy.wait('@getDatabases')

    // Act - Delete database using cypress helper
    cy.deleteEntityFromList({ 
      entityName: 'harmoniq-my-db', 
      productName: 'Edge SQL Database'
    })

    // Assert deletion
    cy.wait('@deleteDatabase')
    cy.verifyToast('Edge SQL Database successfully deleted')
  })
})