const payload = {
  country_call_code: 'BR - 55',
  email: 'testuser@cy.com',
  first_name: 'Edited User',
  language: 'en',
  last_name: 'Cy',
  mobile: '987654321',
  old_password: 'AAAaaa123!!!',
  password: 'AAAaaa123!!!',
  timezone: 'America/Sao_Paulo',
  two_factor_enabled: true
}

describe('Your Settings spec', () => {
  beforeEach(() => {
    cy.login()
    cy.intercept('GET', '/api/v4/iam/user', { fixture: 'your-settings.json' }).as('getUser')
    cy.intercept('PATCH', '/api/v4/iam/user', { statusCode: 200, body: {} }).as('patchUser')

    cy.get('li[aria-label="Your Settings"] > .p-menuitem-content > .p-menuitem-link').click()
  })

  it('should edit user settings but the email', () => {
    // Arrange
    cy.getByTestId('profile__first-name__input').should('have.value', 'Clean User')
    cy.getByTestId('profile__first-name__input').clear()
    cy.getByTestId('profile__first-name__error-text')
      .should('be.visible')
      .and('have.text', 'First Name is a required field')
    cy.getByTestId('profile__last-name__input').should('have.value', 'Cypress')
    cy.getByTestId('profile__last-name__input').clear()
    cy.getByTestId('profile__last-name__error-text')
      .should('be.visible')
      .and('have.text', 'Last Name is a required field')
    cy.getByTestId('profile__timezone__options').should('have.text', '(UTC +14:00) Etc/GMT-14')
    cy.getByTestId('profile__language').should('have.text', 'LanguageEnglish')
    cy.getByTestId('contact__email__input').should('have.value', 'testuser@cy.com')
    cy.getByTestId('contact__email__input').clear()
    cy.getByTestId('contact__email__error-text')
      .should('be.visible')
      .and('have.text', 'Email is a required field')
    cy.getByTestId('contact__mobile__country-code-options').should('have.text', 'US +1')
    cy.getByTestId('contact__mobile__input').should('have.value', '1234567890')
    cy.getByTestId('contact__mobile__input').clear()
    cy.getByTestId('contact__mobile__error-text')
      .should('be.visible')
      .and('have.text', 'Phone Number is a required field')

    // Act
    cy.getByTestId('profile__first-name__input').type('Edited User')
    cy.getByTestId('profile__last-name__input').type('Cy')
    cy.getByTestId('profile__timezone__options').click()
    cy.get('.p-dropdown-filter').clear()
    cy.get('.p-dropdown-filter').type('são')
    cy.get('#timezone_0').click()
    cy.getByTestId('contact__email__input').type('testuser@cy.com')
    cy.getByTestId('contact__mobile__country-code-options').click()
    cy.get('.p-dropdown-filter').clear()
    cy.get('.p-dropdown-filter').type('br')
    cy.get('#countryCallCode_0').click()
    cy.getByTestId('contact__mobile__input').type('987654321')
    cy.getByTestId('security__old-password__input').type('AAAaaa123!!!')
    cy.getByTestId('security__new-password__input').type('AAAaaa123!!!')
    cy.getByTestId('security__confirm-password__input').type('A')
    cy.getByTestId('security__confirm-password__error-text')
      .should('be.visible')
      .and('have.text', 'Passwords must match')
    cy.getByTestId('security__confirm-password__input').type('AAaaa123!!!')

    cy.get('.p-inputswitch-slider').click()
    cy.getByTestId('Save_button').click()

    // Assert
    cy.wait('@patchUser').its('request.body').should('deep.equal', payload)
    cy.get('.p-toast-message-content').should('have.text', 'successYour user has been updated')
  })

  it('should edit user email', () => {
    // Arrange
    cy.getByTestId('contact__email__input').should('have.value', 'testuser@cy.com')
    cy.getByTestId('contact__email__input').clear()

    // Act
    cy.getByTestId('contact__email__input').type('testuser@cy.com.br')

    cy.getByTestId('Save_button').click()

    // Assert
    cy.wait('@patchUser')

    cy.get('.p-toast-message-content').should(
      'have.text',
      'Confirmation email sentCheck your inbox and follow the instructions to verify this new email.'
    )
  })
})
