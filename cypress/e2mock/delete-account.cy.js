/* eslint-disable cypress/no-unnecessary-waiting */
import selectors from '../support/selectors'

const fixtures = {
  errorMessage: { detail: "This account is not allowed to be deleted." }
}
describe('Account Settings spec', { tags: ['@dev2'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.intercept('GET', '/api/v4/iam/account').as('getAccountSettingsApi')
    cy.openProduct('Account Settings')

    cy.wait('@getAccountSettingsApi')
  })

  it('should delete account successfully', () => {
    // Arrange
    cy.intercept('DELETE', '/api/v3/account/*', { statusCode: 204, body: 'Success' }).as(
      'successDeleteAccount'
    )
    cy.get(selectors.accountSettings.deleteAccount).click()
    cy.get(selectors.list.deleteDialog.confirmationInputField).type('delete{enter}')

    //Assert
    cy.url().should('include', '/login')

    // Clear session after account deletion
    cy.clearAllSessionStorage()
    cy.clearAllLocalStorage()
    Cypress.session.clearAllSavedSessions()
  })

  it('should not delete account if user does not have access', () => {
    cy.intercept('DELETE', '/api/v3/account/*', {
      statusCode: 403,
      body: fixtures.errorMessage
    }).as('failedDeleteAccount')
    cy.get(selectors.accountSettings.deleteAccount).click()
    cy.get(selectors.list.deleteDialog.confirmationInputField).type('delete{enter}')
    cy.wait('@failedDeleteAccount')
    // Assert
    cy.verifyToast('Error', fixtures.errorMessage.detail)
  })
})
