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
    cy.intercept('POST', '/graphql/cities', (req) => {
      if (req.body.query === 'query alltimezones { allTimezones }') {
        req.reply({ fixture: '/cities/all-timezones.json' })
      }

      if (req.body.query === 'query allCountries {allCountries { name, code2, phone } }') {
        req.reply({ fixture: '/cities/all-countries.json' })
      }
    }).as('citiesApi')

    cy.openProduct('Your Settings')
  })

  it('should edit user settings but the email', () => {
    // Arrange
    cy.get(selectors.yourSettings.firstNameInput).clear()
    cy.get(selectors.yourSettings.lastNameInput).clear()
    cy.get(selectors.yourSettings.emailInput).clear()
    cy.get(selectors.yourSettings.mobileInput).clear()

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
