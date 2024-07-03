import selectors from '../support/selectors'

const companyName = 'Company Teste'
const companyId = '00.000.000/0001-00'
const postalCode = '14055-010'

describe('Account Settings spec', () => {
  beforeEach(() => {
    cy.login()
    cy.openItemThroughMenuAccount('Account Settings')
  })

  it('should update account settings successfully', () => {
    // Arrange
    cy.get(selectors.accountSettings.companyName).clear()
    cy.get(selectors.accountSettings.companyName).type(companyName)
    cy.get(selectors.accountSettings.companyId).clear()
    cy.get(selectors.accountSettings.companyId).type(companyId)
    cy.get(selectors.accountSettings.postalCode).clear()
    cy.get(selectors.accountSettings.postalCodeError).should('have.text', 'Postal Code is a required field')
    cy.get(selectors.accountSettings.postalCode).type(postalCode)

    // Act
    cy.get(selectors.accountSettings.submitButton).click()

    // Assert
    cy.verifyToast('success', 'Your account settings have been updated')
    cy.openItemThroughMenuAccount('Account Settings')
    cy.get(selectors.accountSettings.companyName).should('have.value', companyName)
    cy.get(selectors.accountSettings.companyId).should('have.value', companyId)
    cy.get(selectors.accountSettings.postalCode).should('have.value', postalCode)
  })
})
