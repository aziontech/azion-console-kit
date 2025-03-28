/* eslint-disable cypress/no-unnecessary-waiting */
import selectors from '../support/selectors'

const fixtures = {
  errorMessage: { detail: "You cannot delete an account that has vendor's edge functions." }
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
    cy.intercept('DELETE', '/v4/account/account', { statusCode: 200, body: 'Success' }).as(
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
  it('should not delete account if user dos not has access', () => {
    cy.intercept('DELETE', '/v4/account/account', {
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
