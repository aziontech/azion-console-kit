import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'
let credentialName

describe('Credentials spec', () => {
  beforeEach(() => {
    cy.login()
    credentialName = generateUniqueName('Credential')
  })
  afterEach(() => {
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('Credential successfully deleted')
    })
  })

  it('should create a credential', () => {
    // Arrange
    cy.openProduct('Credentials')
    cy.get(selectors.createCredentialButton).click()
    cy.get(selectors.credentialNameInput).clear()
    cy.get(selectors.credentialNameInput).type(credentialName)
    cy.get(selectors.credentialDescriptionTextarea).type(credentialName)
    cy.get(selectors.formSubmitButton).click()

    // Assert
    cy.verifyToast('success', 'Your credential token has been created')
    cy.get(selectors.copyTokenButton).click()
    cy.verifyToast('Successfully copied!')
    cy.get(selectors.formCancelButton).click()
    cy.get(selectors.dataTableSearchInput).clear()
    cy.get(selectors.dataTableSearchInput).type(credentialName)
    cy.get(selectors.listTableBlockColumnNameRow).should('have.text', credentialName)
  })
})
