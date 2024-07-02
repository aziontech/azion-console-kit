import selectors from '../support/selectors'

describe('Account Settings spec', () => {
  beforeEach(() => {
    cy.login()
    cy.openItemThroughMenuAccount('Account Settings')
  })

  it('should update account settings successfully', () => {
    // Arrange
    cy.get(selectors.accountSettings.accountName).should('have.value', Cypress.env('CYPRESS_USERNAME_STAGE'))
    cy.get(selectors.accountSettings.companyName).clear()
    cy.get(selectors.accountSettings.companyName).type('Company Teste')
    cy.get(selectors.accountSettings.companyId).clear()
    cy.get(selectors.accountSettings.companyId).type('00.000.000/0001-00')
    cy.get(selectors.accountSettings.postalCode).clear()
    cy.get(selectors.accountSettings.postalCodeError).should('have.text', 'Postal Code is a required field')
    cy.get(selectors.accountSettings.postalCode).type('14055-010')

    // Act
    cy.get(selectors.accountSettings.submitButton).click()

    // Assert
    cy.verifyToast('success', 'Your account settings have been updated')
    cy.openItemThroughMenuAccount('Account Settings')
    cy.get(selectors.accountSettings.companyName).should('have.value', 'Company Teste')
    cy.get(selectors.accountSettings.companyId).should('have.value', '00.000.000/0001-00')
    cy.get(selectors.accountSettings.postalCode).should('have.value', '14055-010')
  })
})
