const selectors = {
  form: {
    accountName: '[data-testid="account-settings__account-name__input"]',
    companyName: '[data-testid="account-settings__company-name__input"]',
    companyId: '[data-testid="account-settings__company-id__input"]',
    postalCode: '[data-testid="account-settings__postal-code__input"]',
    postalCodeError: '[data-testid="account-settings__postal-code__error-message"]',
    submitButton: '[data-testid="form-actions-submit-button"] > .p-button-label'
  }
}

describe('Account Settings spec', () => {
  beforeEach(() => {
    cy.login()
    cy.openItemThroughMenuAccount('Account Settings')
  })

  it('should update account settings successfully', () => {
    // Arrange
    cy.get(selectors.form.accountName).should('have.value', Cypress.env('CYPRESS_USERNAME_STAGE'))
    cy.get(selectors.form.companyName).clear()
    cy.get(selectors.form.companyName).type('Company Teste')
    cy.get(selectors.form.companyId).clear()
    cy.get(selectors.form.companyId).type('00.000.000/0001-00')
    cy.get(selectors.form.postalCode).clear()
    cy.get(selectors.form.postalCodeError).should('have.text', 'Postal Code is a required field')
    cy.get(selectors.form.postalCode).type('14055-010')

    // Act
    cy.get(selectors.form.submitButton).click()

    // Assert
    cy.verifyToast('success', 'Your account settings have been updated')
    cy.openItemThroughMenuAccount('Account Settings')
    cy.get(selectors.form.companyName).should('have.value', 'Company Teste')
    cy.get(selectors.form.companyId).should('have.value', '00.000.000/0001-00')
    cy.get(selectors.form.postalCode).should('have.value', '14055-010')
  })
})
