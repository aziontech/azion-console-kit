import selectors from '../support/selectors';

describe('Your Settings spec', () => {
  beforeEach(() => {
    cy.login()
    cy.openItemThroughMenuAccount('Your Settings')
  })

  it('should edit user phone number', () => {
    // Arrange
    cy.intercept('PATCH', '/api/v4/iam/user').as('patchUser')

    cy.get(selectors.contact.mobileInput).clear()
    cy.get(selectors.contact.mobileError)
      .should('be.visible')
      .and('have.text', 'Phone Number is a required field')

    // Act
    cy.get(selectors.contact.mobileCountryCodeOptions).click()
    cy.get(selectors.contact.countryCodeFilter).clear()
    cy.get(selectors.contact.countryCodeFilter).type('br')
    cy.get(selectors.contact.countryCodeOption(0)).click()
    cy.get(selectors.contact.mobileInput).type('424242424242')
    cy.get(selectors.form.submitButton).click()

    // Assert
    cy.wait('@patchUser')
    cy.verifyToast('success', 'Your user has been updated')
  })
})
