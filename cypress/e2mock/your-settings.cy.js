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
    cy.get(selectors.profile.firstNameInput).should('have.value', 'Clean User')
    cy.get(selectors.profile.firstNameInput).clear()
    cy.get(selectors.profile.firstNameError)
      .should('be.visible')
      .and('have.text', 'First Name is a required field')
    cy.get(selectors.profile.lastNameInput).should('have.value', 'Cypress')
    cy.get(selectors.profile.lastNameInput).clear()
    cy.get(selectors.profile.lastNameError)
      .should('be.visible')
      .and('have.text', 'Last Name is a required field')
    cy.get(selectors.profile.timezoneOptions).should('have.text', '(UTC +14:00) Etc/GMT-14')
    cy.get(selectors.profile.language).should('have.text', 'LanguageEnglish')
    cy.get(selectors.contact.emailInput).should('have.value', 'testuser@cy.com')
    cy.get(selectors.contact.emailInput).clear()
    cy.get(selectors.contact.emailError)
      .should('be.visible')
      .and('have.text', 'Email is a required field')
    cy.get(selectors.contact.mobileCountryCodeOptions).should('have.text', 'US +1')
    cy.get(selectors.contact.mobileInput).should('have.value', '1234567890')
    cy.get(selectors.contact.mobileInput).clear()
    cy.get(selectors.contact.mobileError)
      .should('be.visible')
      .and('have.text', 'Phone Number is a required field')

    // Act
    cy.get(selectors.profile.firstNameInput).type('Edited User')
    cy.get(selectors.profile.lastNameInput).type('Cy')
    cy.get(selectors.profile.timezoneOptions).click()
    cy.get(selectors.contact.countryCodeFilter).clear()
    cy.get(selectors.contact.countryCodeFilter).type('são')
    cy.get('#timezone_0').click()
    cy.get(selectors.contact.emailInput).type('testuser@cy.com')
    cy.get(selectors.contact.mobileCountryCodeOptions).click()
    cy.get(selectors.contact.countryCodeFilter).clear()
    cy.get(selectors.contact.countryCodeFilter).type('br')
    cy.get(selectors.contact.countryCodeOption(0)).click()
    cy.get(selectors.contact.mobileInput).type('987654321')
    cy.get(selectors.security.oldPasswordInput).type('AAAaaa123!!!')
    cy.get(selectors.security.newPasswordInput).type('AAAaaa123!!!')
    cy.get(selectors.security.confirmPasswordInput).type('A')
    cy.get(selectors.security.confirmPasswordError)
      .should('be.visible')
      .and('have.text', 'Passwords must match')
    cy.get(selectors.security.confirmPasswordInput).type('AAaaa123!!!')

    cy.get(selectors.security.twoFactorToggle).click()
    cy.get(selectors.form.submitButton).click()

    // Assert
    cy.wait('@patchUser').its('request.body').should('deep.equal', payload)
    cy.verifyToast('success', 'Your user has been updated')
  })

  it('should edit user email', () => {
    // Arrange
    cy.get(selectors.contact.emailInput).should('have.value', 'testuser@cy.com')
    cy.get(selectors.contact.emailInput).clear()

    // Act
    cy.get(selectors.contact.emailInput).type('testuser@cy.com.br')

    cy.get(selectors.form.submitButton).click()

    // Assert
    cy.wait('@patchUser')

    cy.verifyToast(
      'Confirmation email sent',
      'Check your inbox and follow the instructions to verify this new email.'
    )
  })
})
