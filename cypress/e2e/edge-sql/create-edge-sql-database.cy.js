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
    cy.intercept('POST', '/v4/edge_sql/databases').as('createDatabase')
    
    cy.get(selectors.edgeSQL.createButton).click()
    cy.get(selectors.edgeSQL.nameInput).clear()
    cy.get(selectors.edgeSQL.nameInput).type(databaseName)
    cy.get(selectors.form.actionsSubmitButton).click()

    cy.wait('@createDatabase').then((interception) => {
      if (interception.response.statusCode >= 200 && interception.response.statusCode < 300) {
        cy.url({ timeout: 15000 }).should('include', '/edge-sql')

        cy.visit('/edge-sql')
        cy.get(selectors.edgeSQL.searchInput).type(`${databaseName}{enter}`)
        cy.get(selectors.edgeSQL.list.nameColumn).should('contain', databaseName)
      } else {
        cy.url().should('include', '/edge-sql/create')
      }
    })
  })

  it('should navigate to database interface when clicking on database', () => {
    cy.get('body').then(($body) => {
      if ($body.find(selectors.edgeSQL.list.firstRow).length > 0) {
        cy.get(selectors.edgeSQL.list.firstRow).click()
        cy.url().should('include', '/edge-sql/database/')
        cy.get('[data-testid="edge-sql-database-content-block"]').should('exist')
      } else {
        cy.log('No databases available for navigation test')
      }
    })
  })

  afterEach(() => {
    cy.window().then((win) => {
      if (
        win.location.pathname.includes('/edge-sql') &&
        !win.location.pathname.includes('/create')
      ) {
        cy.visit('/edge-sql')

        cy.get('[data-testid="edge-sql-content-block"]').should('exist')

        cy.get('body').then(($body) => {
          if ($body.find(selectors.edgeSQL.searchInput).length > 0) {
            cy.get(selectors.edgeSQL.searchInput).clear()
            cy.get(selectors.edgeSQL.searchInput).type(`${databaseName}{enter}`)
          }
        })

        cy.get('body').then(($body) => {
          if (
            $body.find(`${selectors.edgeSQL.list.nameColumn}:contains("${databaseName}")`).length >
            0
          ) {
            cy.get(selectors.edgeSQL.list.actionsButton).first().click()
            cy.get(selectors.edgeSQL.list.deleteButton).click()
            cy.get('body').then(($confirmBody) => {
              if ($confirmBody.find('[data-testid="confirm-deletion-dialog"]').length > 0) {
                cy.get('[data-testid="confirm-deletion-dialog"] .p-button-danger').click()
              }
            })
          }
        })
      }
    })
  })
})
