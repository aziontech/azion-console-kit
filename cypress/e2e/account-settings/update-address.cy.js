/* eslint-disable cypress/no-unnecessary-waiting */
import selectors from '../../support/selectors'
import generateUniqueName from '../../support/utils'

const fixtures = {
  companyName: 'Company Name',
  companyId: '00.000.000/0001-00',
  postalCode: '14055-010',
  address: '13, Elm Street',
  complement: 'Apt. 123'
}

describe('Account Settings spec', { tags: ['@dev', '@xfail'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Account Settings')

    fixtures.companyName = generateUniqueName('companyName')
    cy.wait(3000)
  })

  it('should update address info successfully', () => {
    // Arrange
    const randomCountryOption = Math.floor(Math.random() * 5)
    const firstOption = 0

    cy.get(selectors.accountSettings.postalCode).clear()
    cy.get(selectors.accountSettings.address).clear()
    cy.get(selectors.accountSettings.complement).clear()

    // Act
    cy.get(selectors.accountSettings.postalCode).type(fixtures.postalCode, { delay: 0 })

    cy.get(selectors.accountSettings.countryDropdown).click()
    cy.get(selectors.accountSettings.countryOption(randomCountryOption)).click()

    // store country alias value to be used for validation
    cy.get(selectors.accountSettings.country).invoke('text').as('countryValue')

    // wait for cities api to provide region options
    cy.wait(1000)
    cy.get(selectors.accountSettings.regionDropdown).click()
    cy.get(selectors.accountSettings.regionOption(firstOption)).click()

    // store region alias value to be used for validation
    cy.get(selectors.accountSettings.region).invoke('text').as('regionValue')

    // wait for cities api to provide city options
    cy.wait(1000)
    cy.get(selectors.accountSettings.cityDropdown).click()
    cy.get(selectors.accountSettings.cityOption(firstOption)).click()

    // store city alias value to be used for validation
    cy.get(selectors.accountSettings.city).invoke('text').as('cityValue')

    cy.get(selectors.accountSettings.address).type(fixtures.address, { delay: 0 })
    cy.get(selectors.accountSettings.complement).type(fixtures.complement, { delay: 0 })

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
})