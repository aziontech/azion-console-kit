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
    cy.openProduct('Account Settings')

    fixtures.companyName = generateUniqueName('companyName')
    cy.wait(3000)
  })

  it('should update the billing email list successfully', () => {
    // Arrange
    const uniquePrefix = generateUniqueName('email')
    const emails = `${uniquePrefix}@mail.com;${uniquePrefix}@example.com`

    cy.get(selectors.accountSettings.billingEmails).clear()

    // Act
    cy.get(selectors.accountSettings.billingEmails).type(emails, { delay: 0 })

    cy.get(selectors.accountSettings.submitButton).click()

    // Assert
    cy.verifyToast('success', 'Your account settings have been updated')
    cy.openProduct('Account Settings')

    cy.get(selectors.accountSettings.billingEmails).should('have.value', emails)
  })
})
