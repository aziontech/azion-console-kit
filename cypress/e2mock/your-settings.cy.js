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

const selectors = {
  profile: {
    firstNameInput: '[data-testid="profile__first-name__input"]',
    firstNameError: '[data-testid="profile__first-name__error-text"]',
    lastNameInput: '[data-testid="profile__last-name__input"]',
    lastNameError: '[data-testid="profile__last-name__error-text"]',
    timezoneOptions: '[data-testid="profile__timezone__options"]',
    language: '[data-testid="profile__language"]',
  },
  contact: {
    emailInput: '[data-testid="contact__email__input"]',
    emailError: '[data-testid="contact__email__error-text"]',
    mobileCountryCodeOptions: '[data-testid="contact__mobile__country-code-options"]',
    countryCodeFilter: '.p-dropdown-filter',
    countryCodeOption: (countryCode) => `#countryCallCode_${countryCode}`,
    mobileInput: '[data-testid="contact__mobile__input"]',
    mobileError: '[data-testid="contact__mobile__error-text"]',
  },
  security: {
    oldPasswordInput: '[data-testid="security__old-password__input"]',
    newPasswordInput: '[data-testid="security__new-password__input"]',
    confirmPasswordInput: '[data-testid="security__confirm-password__input"]',
    confirmPasswordError: '[data-testid="security__confirm-password__error-text"]',
    twoFactorToggle: '.p-inputswitch-slider',
  },
  form: {
    submitButton: '[data-testid="form-actions-submit-button"]',
  },
  toast: {
    content: '.p-toast-message-content',
  },
}

describe('Your Settings spec', () => {
  beforeEach(() => {
    cy.login()
    cy.intercept('GET', '/api/v4/iam/user', { fixture: 'your-settings.json' }).as('getUser')
    cy.intercept('PATCH', '/api/v4/iam/user', { statusCode: 200, body: {} }).as('patchUser')

    cy.openMenuItem('Your Settings')
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
    cy.get(selectors.toast.content).should('have.text', 'successYour user has been updated')
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

    cy.get(selectors.toast.content).should(
      'have.text',
      'Confirmation email sentCheck your inbox and follow the instructions to verify this new email.'
    )
  })
})