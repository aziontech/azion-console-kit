import selectors from '../../../support/selectors'
import tableHelpers from '../../../support/console-kit-helpers/table'

let hasRows = false

describe('Variables - Delete', { tags: ['@smoke', '@variables'] }, () => {
  before(() => {
    cy.login()
  })

  it('should navigate to variables list', () => {
    cy.visit('/variables')
    tableHelpers.waitForListReady()
  })

  it('should check for rows with action menu buttons', () => {
    cy.get('body').then(($body) => {
      if ($body.find(selectors.list.actionsMenu.button).length > 0) {
        hasRows = true
        cy.get(selectors.list.actionsMenu.button).first().should('exist')
      } else {
        cy.log('No rows exist - skipping delete tests')
      }
    })
  })

  it('should open delete dialog via actions menu', () => {
    if (!hasRows) {
      cy.log('Skipping - no rows')
      return
    }
    tableHelpers.openActionsMenu()
    tableHelpers.clickActionsMenuItem('Delete')
    cy.get(selectors.list.deleteDialog.confirmationInputField).should('exist')
  })

  it('should cancel delete and return to list', () => {
    if (!hasRows) {
      cy.log('Skipping - no rows')
      return
    }
    cy.get(selectors.list.deleteDialog.cancelButton).click()
    cy.get(selectors.list.dataTable).should('exist')
  })
})
