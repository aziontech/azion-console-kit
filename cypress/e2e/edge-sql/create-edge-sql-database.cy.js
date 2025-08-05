// cypress/e2e/edge-sql/create-edge-sql-database.cy.js
import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let databaseName

describe('Edge SQL spec', { tags: ['@dev5'] }, () => {
  beforeEach(() => {
    databaseName = generateUniqueName('EdgeSQL-DB')
    cy.login()
    cy.openProduct('Edge SQL')
  })

  it('should create a new Edge SQL database', () => {
    // Arrange
    cy.intercept('GET', '/v4/edge_sql/databases**').as('getDatabases')
    cy.intercept('POST', '/v4/edge_sql/databases').as('createDatabase')

    // Act
    cy.get(selectors.edgeSQL.createButton).click()
    cy.get(selectors.edgeSQL.nameInput).clear()
    cy.get(selectors.edgeSQL.nameInput).type(databaseName)
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.verifyToast('success', 'Database has been created')
    
    cy.wait('@createDatabase')
    cy.wait('@getDatabases')

    // Verify database appears in list
    cy.get(selectors.edgeSQL.searchInput).type(`${databaseName}{enter}`)
    cy.get(selectors.edgeSQL.list.nameColumn).should('contain', databaseName)
  })

  it('should navigate to database interface when clicking on database', () => {
    // Arrange
    cy.intercept('GET', '/v4/edge_sql/databases**').as('getDatabases')
    cy.intercept('GET', '/v4/edge_sql/databases/*/tables**').as('getTables')

    cy.wait('@getDatabases')

    // Act - Click on first database in list
    cy.get(selectors.edgeSQL.list.firstRow).click()

    // Assert
    cy.wait('@getTables')
    cy.url().should('include', '/edge-sql/database/')
    cy.get('[data-testid="edge-sql-database-content-block"]').should('exist')
    cy.get('.sql-interface').should('exist')
  })

  afterEach(() => {
    // Clean up created database
    cy.deleteEntityFromList({ 
      entityName: databaseName, 
      productName: 'Edge SQL Database'
    }).then(() => {
      cy.verifyToast('Edge SQL Database successfully deleted')
    })
  })
})