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

describe('Account Settings spec', { tags: ['@dev2'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.intercept('GET', '/api/v4/iam/account').as('getAccountSettingsApi')
    cy.openProduct('Account Settings')

    fixtures.companyName = generateUniqueName('companyName')
    cy.wait('@getAccountSettingsApi')
  })

  it('should update account settings successfully', () => {
    // Arrange
    cy.get(selectors.accountSettings.companyName).clear()
    cy.get(selectors.accountSettings.companyId).clear()
    cy.get(selectors.accountSettings.postalCode).clear()

    // Act
    cy.get(selectors.accountSettings.companyName).type(fixtures.companyName, { delay: 0 })
    cy.get(selectors.accountSettings.companyId).type(fixtures.companyId, { delay: 0 })
    cy.get(selectors.accountSettings.postalCode).type(fixtures.postalCode, { delay: 0 })

    cy.get(selectors.accountSettings.submitButton).click()

    // Assert
    cy.verifyToast('success', 'Your account settings have been updated')
    cy.openProduct('Account Settings')
    cy.get(selectors.accountSettings.companyName).should('have.value', fixtures.companyName)
    cy.get(selectors.accountSettings.companyId).should('have.value', fixtures.companyId)
    cy.get(selectors.accountSettings.postalCode).should('have.value', fixtures.postalCode)
  })
})
