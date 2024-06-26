describe('Your Settings spec', () => {
  beforeEach(() => {
    cy.login()
    cy.get('li[aria-label="Your Settings"] > .p-menuitem-content > .p-menuitem-link').click()
  })

  it('should edit user phone number', () => {
    // Arrange
    cy.intercept('PATCH', '/api/v4/iam/user').as('patchUser')

    cy.getByTestId('contact__mobile__input').clear()
    cy.getByTestId('contact__mobile__error-text')
      .should('be.visible')
      .and('have.text', 'Phone Number is a required field')

    // Act
    cy.getByTestId('contact__mobile__country-code-options').click()
    cy.get('.p-dropdown-filter').clear()
    cy.get('.p-dropdown-filter').type('br')
    cy.get('#countryCallCode_0').click()
    cy.getByTestId('contact__mobile__input').type('424242424242')

    cy.getByTestId('form-actions-submit-button').click()

    // Assert
    cy.wait('@patchUser')
    cy.get('.p-toast-message-content').should('have.text', 'successYour user has been updated')
  })
})
