// cypress/e2e/edge-sql/edge-sql-database-interface.cy.js
import selectors from '../../support/selectors'

describe('Edge SQL Database Interface spec', { tags: ['@dev5'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Edge SQL')
    
    // Navigate to first available database
    cy.intercept('GET', '/v4/edge_sql/databases**').as('getDatabases')
    cy.wait('@getDatabases')
    cy.get(selectors.edgeSQL.list.firstRow).click()
    
    cy.intercept('GET', '/v4/edge_sql/databases/*/tables**').as('getTables')
    cy.wait('@getTables')
  })

  it('should execute a SQL query', () => {
    // Arrange
    cy.intercept('POST', '/v4/edge_sql/databases/*/query').as('executeQuery')
    
    // Act - Expand editor and execute query
    cy.get('.p-accordion-header').contains('Query Editor').click()
    cy.get(selectors.edgeSQL.queryEditor).clear()
    cy.get(selectors.edgeSQL.queryEditor).type('SELECT 1 as test_column;')
    cy.get(selectors.edgeSQL.executeButton).click()

    // Assert
    cy.wait('@executeQuery')
    cy.verifyToast('success', 'Query executed')
    cy.get(selectors.edgeSQL.resultsTab).should('be.visible')
  })

  it('should use quick templates', () => {
    // Act - Use a template
    cy.get(selectors.edgeSQL.templatesSection).within(() => {
      cy.contains('Quick Templates').click()
      cy.contains('Select All').click()
    })
    
    // Assert - Template was applied
    cy.get(selectors.edgeSQL.queryEditor).should('not.be.empty')
  })

  it('should navigate back to databases list', () => {
    // Act
    cy.get(selectors.edgeSQL.backButton).click()
    
    // Assert
    cy.url().should('include', '/edge-sql')
    cy.url().should('not.include', '/database/')
    cy.get('[data-testid="edge-sql-content-block"]').should('exist')
  })
})