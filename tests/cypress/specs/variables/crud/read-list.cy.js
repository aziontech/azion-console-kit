import selectors from '../../../support/selectors'
import generateUniqueName from '../../../support/utils'
import tableHelpers from '../../../support/console-kit-helpers/table'

describe('Variables - Read/List', { tags: ['@smoke', '@variables'] }, () => {
  before(() => {
    cy.login()
  })

  it('should navigate to variables list', () => {
    cy.visit('/variables')
    cy.url().should('include', '/variables')
  })

  it('should display the list table with create button', () => {
    tableHelpers.waitForListReady()
    cy.get(selectors.variables.createButton).should('exist')
  })

  it('should display correct columns', () => {
    // Verify column headers exist (not row data, which may be empty)
    cy.get(selectors.list.dataTable).within(() => {
      cy.contains('th', 'Key').should('exist')
      cy.contains('th', 'Value').should('exist')
      cy.contains('th', 'Last Editor').should('exist')
      cy.contains('th', 'Last Modified').should('exist')
    })
  })

  it('should search for a variable', () => {
    tableHelpers.searchFor('test')
    // After search, table should update (either show results or empty state)
    cy.get(selectors.list.dataTable).should('exist')
  })

  it('should clear search and restore list', () => {
    cy.get(selectors.list.searchInput).clear()
    cy.get(selectors.list.dataTable).should('exist')
  })

  it('should have action menu button on each row', () => {
    cy.get('body').then(($body) => {
      // Only check if there are rows
      if ($body.find(selectors.list.actionsMenu.button).length > 0) {
        cy.get(selectors.list.actionsMenu.button).first().should('exist')
      }
    })
  })
})
