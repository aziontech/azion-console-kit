import selectors from '../support/selectors'

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
    cy.openItemThroughMenuAccount('Your Settings')
  })

  it('should edit user settings but the email', () => {
    // Arrange
    cy.get(selectors.yourSettings.firstNameInput).should('have.value', 'Clean User')
    cy.get(selectors.yourSettings.firstNameInput).clear()
    cy.get(selectors.yourSettings.firstNameError)
      .should('be.visible')
      .and('have.text', 'First Name is a required field')
    cy.get(selectors.yourSettings.lastNameInput).should('have.value', 'Cypress')
    cy.get(selectors.yourSettings.lastNameInput).clear()
    cy.get(selectors.yourSettings.lastNameError)
      .should('be.visible')
      .and('have.text', 'Last Name is a required field')
    cy.get(selectors.yourSettings.timezoneOptions).should('have.text', '(UTC +14:00) Etc/GMT-14')
    cy.get(selectors.yourSettings.language).should('have.text', 'LanguageEnglish')
    cy.get(selectors.yourSettings.emailInput).should('have.value', 'testuser@cy.com')
    cy.get(selectors.yourSettings.emailInput).clear()
    cy.get(selectors.yourSettings.emailError)
      .should('be.visible')
      .and('have.text', 'Email is a required field')
    cy.get(selectors.yourSettings.mobileCountryCodeOptions).should('have.text', 'US +1')
    cy.get(selectors.yourSettings.mobileInput).should('have.value', '1234567890')
    cy.get(selectors.yourSettings.mobileInput).clear()
    cy.get(selectors.yourSettings.mobileError)
      .should('be.visible')
      .and('have.text', 'Phone Number is a required field')

    // Act
    cy.get(selectors.yourSettings.firstNameInput).type('Edited User')
    cy.get(selectors.yourSettings.lastNameInput).type('Cy')
    cy.get(selectors.yourSettings.timezoneOptions).click()
    cy.get(selectors.yourSettings.countryCodeFilter).clear()
    cy.get(selectors.yourSettings.countryCodeFilter).type('são')
    cy.get('#timezone_0').click()
    cy.get(selectors.yourSettings.emailInput).type('testuser@cy.com')
    cy.get(selectors.yourSettings.mobileCountryCodeOptions).click()
    cy.get(selectors.yourSettings.countryCodeFilter).clear()
    cy.get(selectors.yourSettings.countryCodeFilter).type('br')
    cy.get(selectors.yourSettings.countryCodeOption(0)).click()
    cy.get(selectors.yourSettings.mobileInput).type('987654321')
    cy.get(selectors.yourSettings.oldPasswordInput).type('AAAaaa123!!!')
    cy.get(selectors.yourSettings.newPasswordInput).type('AAAaaa123!!!')
    cy.get(selectors.yourSettings.confirmPasswordInput).type('A')
    cy.get(selectors.yourSettings.confirmPasswordError)
      .should('be.visible')
      .and('have.text', 'Passwords must match')
    cy.get(selectors.yourSettings.confirmPasswordInput).type('AAaaa123!!!')

    cy.get(selectors.yourSettings.twoFactorToggle).click()
    cy.get(selectors.form.submitButton).click()

    // Assert
    cy.wait('@patchUser').its('request.body').should('deep.equal', payload)
    cy.verifyToast('success', 'Your user has been updated')
  })

  it('should edit user email', () => {
    // Arrange
    cy.get(selectors.yourSettings.emailInput).should('have.value', 'testuser@cy.com')
    cy.get(selectors.yourSettings.emailInput).clear()

    // Act
    cy.get(selectors.yourSettings.emailInput).type('testuser@cy.com.br')

    cy.get(selectors.form.submitButton).click()

    // Assert
    cy.wait('@patchUser')

    cy.verifyToast(
      'Confirmation email sent',
      'Check your inbox and follow the instructions to verify this new email.'
    )
  })
})
