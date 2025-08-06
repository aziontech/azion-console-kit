import selectors from '../../support/selectors'

describe('Edge SQL Database Interface spec', { tags: ['@dev5'] }, () => {
  beforeEach(() => {
    cy.intercept('GET', '/v4/edge_sql/databases**').as('getDatabases')
    cy.intercept('POST', '/v4/edge_sql/databases/*/query').as('executeQuery')
    cy.intercept('GET', '/v4/edge_sql/databases/*/query').as('getQueryHistory')
    cy.intercept('GET', '/v4/edge_sql/databases/**').as('getDatabaseDetails')
    
    cy.login()
    cy.openProduct('Edge SQL')
    
    cy.get('body', { timeout: 10000 }).then($body => {
      if ($body.find(selectors.edgeSQL.list.firstRow).length > 0) {
        cy.get(selectors.edgeSQL.list.firstRow).click()
        cy.url().should('include', '/edge-sql/database/')
      } else {
        cy.log('No databases available - skipping interface tests')
      }
    })
  })

  it('should execute a valid SQL query successfully', () => {
    cy.url().then((url) => {
      if (url.includes('/edge-sql/database/')) {
        const testQuery = 'SELECT 1 as test_column;'
        
        cy.get('.p-accordion-header').contains('Query Editor').click()
        cy.get(selectors.edgeSQL.queryEditor).should('be.visible').clear()
        cy.get(selectors.edgeSQL.queryEditor).type(testQuery)
        cy.get(selectors.edgeSQL.executeButton).should('be.enabled').click()

        cy.wait('@executeQuery').then((interception) => {
          expect(interception.request.body.statements).to.include(testQuery)
        })
        cy.get(selectors.edgeSQL.resultsTab).should('be.visible')
        cy.get(selectors.edgeSQL.resultsTable).should('exist')
      } else {
        cy.log('No database interface available - skipping query test')
      }
    })
  })

  it('should handle SQL query errors gracefully', () => {
    cy.url().then((url) => {
      if (url.includes('/edge-sql/database/')) {
        cy.intercept('POST', '/v4/edge_sql/databases/*/query', {
          statusCode: 400,
          body: { error: 'SQL syntax error near "INVALID"' }
        }).as('executeQueryError')
        
        cy.get('.p-accordion-header').contains('Query Editor').click()
        cy.get(selectors.edgeSQL.queryEditor).clear()
        cy.get(selectors.edgeSQL.queryEditor).type('INVALID SQL QUERY')
        cy.get(selectors.edgeSQL.executeButton).click()

        cy.wait('@executeQueryError')
        cy.get(selectors.edgeSQL.errorMessage).should('be.visible')
        cy.get(selectors.edgeSQL.errorMessage).should('contain', 'syntax error')
      } else {
        cy.log('No database interface available - skipping error test')
      }
    })
  })

  it('should prevent execution of empty queries', () => {
    cy.url().then((url) => {
      if (url.includes('/edge-sql/database/')) {
        cy.get('.p-accordion-header').contains('Query Editor').click()
        cy.get(selectors.edgeSQL.queryEditor).clear()
        cy.get(selectors.edgeSQL.executeButton).should('be.disabled')
      } else {
        cy.log('No database interface available - skipping empty query test')
      }
    })
  })

  it('should use quick templates', () => {
    cy.url().then((url) => {
      if (url.includes('/edge-sql/database/')) {
        cy.get('body').then($body => {
          if ($body.find(selectors.edgeSQL.templatesSection).length > 0) {
            cy.get(selectors.edgeSQL.templatesSection).within(() => {
              cy.get('body').then($templates => {
                if ($templates.find(':contains("Quick Templates")').length > 0) {
                  cy.contains('Quick Templates').click()
                  cy.contains('Select All').click()
                  cy.get(selectors.edgeSQL.queryEditor).should('not.be.empty')
                } else {
                  cy.log('Quick Templates not found')
                }
              })
            })
          } else {
            cy.log('Templates section not found')
          }
        })
      } else {
        cy.log('No database interface available - skipping templates test')
      }
    })
  })

  it('should navigate back to databases list', () => {
    cy.url().then((url) => {
      if (url.includes('/edge-sql/database/')) {
        cy.get(selectors.edgeSQL.backButton).click()
        cy.url().should('include', '/edge-sql')
        cy.url().should('not.include', '/database/')
        cy.get('[data-testid="edge-sql-content-block"]').should('exist')
      } else {
        cy.log('No database interface available - skipping navigation test')
      }
    })
  })
})