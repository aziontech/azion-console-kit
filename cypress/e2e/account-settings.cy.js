import selectors from '../support/selectors'
import generateUniqueName from '../support/utils'

const waitMultipleTimes = (alias, times) => {
  for (; times; times--) {
    cy.wait(alias)
  }
}

const fixtures = {
  companyName: 'Company Name',
  companyId: '00.000.000/0001-00',
  postalCode: '14055-010',
  address: '13, Elm Street',
  complement: 'Apt. 123'
}

describe('Account Settings spec', { tags: ['run',] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Account Settings')

    fixtures.companyName = generateUniqueName('companyName')

    cy.intercept('graphql/cities/').as('citiesApi')
    waitMultipleTimes('@citiesApi', 3)
  })

  it('should update account settings successfully', () => {
    // Arrange
    cy.get(selectors.accountSettings.companyName).clear()
    cy.get(selectors.accountSettings.companyId).clear()
    cy.get(selectors.accountSettings.postalCode).clear()

    // Act
    cy.get(selectors.accountSettings.companyName).type(fixtures.companyName)
    cy.get(selectors.accountSettings.companyId).type(fixtures.companyId)
    cy.get(selectors.accountSettings.postalCode).type(fixtures.postalCode)

    cy.get(selectors.accountSettings.submitButton).click()

    // Assert
    cy.verifyToast('success', 'Your account settings have been updated')
    cy.openProduct('Account Settings')
    cy.get(selectors.accountSettings.companyName).should('have.value', fixtures.companyName)
    cy.get(selectors.accountSettings.companyId).should('have.value', fixtures.companyId)
    cy.get(selectors.accountSettings.postalCode).should('have.value', fixtures.postalCode)
  })

  it('should update address info successfully', () => {
    // Arrange
    const randomCountryOption = Math.floor(Math.random() * 5)
    const firstOption = 0

    cy.get(selectors.accountSettings.postalCode).clear()
    cy.get(selectors.accountSettings.address).clear()
    cy.get(selectors.accountSettings.complement).clear()

    // Act
    cy.get(selectors.accountSettings.postalCode).type(fixtures.postalCode)

    cy.get(selectors.accountSettings.countryDropdown).click()
    cy.get(selectors.accountSettings.countryOption(randomCountryOption)).click()

    // store country alias value to be used for validation
    cy.get(selectors.accountSettings.country).invoke('text').as('countryValue')

    // wait for cities api to provide region options
    cy.wait('@citiesApi')
    cy.get(selectors.accountSettings.regionDropdown).click()
    cy.get(selectors.accountSettings.regionOption(firstOption)).click()

    // store region alias value to be used for validation
    cy.get(selectors.accountSettings.region).invoke('text').as('regionValue')

    // wait for cities api to provide city options
    cy.wait('@citiesApi')
    cy.get(selectors.accountSettings.cityDropdown).click()
    cy.get(selectors.accountSettings.cityOption(firstOption)).click()

    // store city alias value to be used for validation
    cy.get(selectors.accountSettings.city).invoke('text').as('cityValue')

    cy.get(selectors.accountSettings.address).type(fixtures.address)
    cy.get(selectors.accountSettings.complement).type(fixtures.complement)

    cy.get(selectors.accountSettings.submitButton).click()

    // Assert
    cy.verifyToast('success', 'Your account settings have been updated')
    cy.openProduct('Account Settings')

    cy.get(selectors.accountSettings.postalCode).should('have.value', fixtures.postalCode)
    cy.get('@countryValue').then((countryValue) => {
      cy.get(selectors.accountSettings.country).should('have.text', countryValue)
    })
    cy.get('@regionValue').then((regionValue) => {
      cy.get(selectors.accountSettings.region).should('have.text', regionValue)
    })
    cy.get('@cityValue').then((cityValue) => {
      cy.get(selectors.accountSettings.city).should('have.text', cityValue)
    })
    cy.get(selectors.accountSettings.address).should('have.value', fixtures.address)
    cy.get(selectors.accountSettings.complement).should('have.value', fixtures.complement)
  })

  it('should update the billing email list successfully', () => {
    // Arrange
    const uniquePrefix = generateUniqueName('email')
    const emails = `${uniquePrefix}@mail.com;${uniquePrefix}@example.com`

    cy.get(selectors.accountSettings.billingEmails).clear()

    // Act
    cy.get(selectors.accountSettings.billingEmails).type(emails)

    cy.get(selectors.accountSettings.submitButton).click()

    // Assert
    cy.verifyToast('success', 'Your account settings have been updated')
    cy.openProduct('Account Settings')

    cy.get(selectors.accountSettings.billingEmails).should('have.value', emails)
  })
})
