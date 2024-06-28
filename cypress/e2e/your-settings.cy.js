const selectors = {
  contact: {
    mobileInput: '[data-testid="contact__mobile__input"]',
    mobileErrorText: '[data-testid="contact__mobile__error-text"]',
    mobileCountryCodeOptions: '[data-testid="contact__mobile__country-code-options"]',
    countryCodeFilter: '.p-dropdown-filter',
    countryCodeOption: (countryCode) => `#countryCallCode_${countryCode}`,
    submitButton: '[data-testid="form-actions-submit-button"]'
  }
}

describe('Your Settings spec', () => {
  beforeEach(() => {
    cy.login()
    cy.openMenuItem('Your Settings')
  })

  it('should edit user phone number', () => {
    // Arrange
    cy.intercept('PATCH', '/api/v4/iam/user').as('patchUser')

    cy.get(selectors.contact.mobileInput).clear()
    cy.get(selectors.contact.mobileErrorText)
      .should('be.visible')
      .and('have.text', 'Phone Number is a required field')

    // Act
    cy.get(selectors.contact.mobileCountryCodeOptions).click()
    cy.get(selectors.contact.countryCodeFilter).clear()
    cy.get(selectors.contact.countryCodeFilter).type('br')
    cy.get(selectors.contact.countryCodeOption(0)).click()
    cy.get(selectors.contact.mobileInput).type('424242424242')

    cy.get(selectors.contact.submitButton).click()

    // Assert
    cy.wait('@patchUser')
    cy.verifyToast('successYour user has been updated')
  })
})
