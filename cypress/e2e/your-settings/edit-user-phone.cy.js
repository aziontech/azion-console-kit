import selectors from '../../support/selectors'

describe('Your Settings spec', () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Your Settings')
  })

  it('should edit user phone number', () => {
    // Arrange
    cy.intercept('PATCH', '/api/v4/iam/user').as('patchUser')

    cy.get(selectors.yourSettings.mobileInput).clear()
    cy.get(selectors.yourSettings.mobileError)
      .should('be.visible')
      .and('have.text', 'Phone Number is a required field')

    // Act
    cy.get(selectors.yourSettings.mobileCountryCodeOptions).click()
    cy.get(selectors.yourSettings.countryCodeFilter).clear()
    cy.get(selectors.yourSettings.countryCodeFilter).type('br')
    cy.get(selectors.yourSettings.countryCodeOption(0)).click()
    cy.get(selectors.yourSettings.mobileInput).type('424242424242')
    cy.get(selectors.form.submitButton).click()

    // Assert
    cy.wait('@patchUser')
    cy.verifyToast('success', 'Your user has been updated')
  })
})
