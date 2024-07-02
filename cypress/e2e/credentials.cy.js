import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

const credentialName = generateUniqueName('Credential')

describe('Credentials', () => {
  beforeEach(() => {
    cy.login()
    cy.openItemThroughMenuAccount('Credentials')
  })

  it('should create a credential from the table', () => {
    // Arrange
    cy.get(selectors.credential.createCredentialBtn).click()
    cy.get(selectors.credential.nameInput).type('N')
    cy.get(selectors.credential.nameInput).clear()
    cy.get(selectors.credential.nameErrorText)
      .should('be.visible')
      .and('have.text', 'Name is a required field')
    cy.get(selectors.credential.tokenCopyButton).should('be.disabled')
    cy.get(selectors.credential.statusSwitch).should('have.class', 'p-inputswitch-checked')

    // Act
    cy.get(selectors.credential.nameInput).type(credentialName)
    cy.get(selectors.credential.descriptionField).type('New Credential Description')
    cy.get(selectors.form.submitButton).click()

    // Assert
    cy.verifyToast('success', 'Your credential token has been created')
    cy.get(selectors.credential.tokenCopyButton).click()
    cy.verifyToast('Successfully copied!')
    cy.get(selectors.form.actionsCancelButton).click()
    cy.get(selectors.list.searchInput).type(credentialName)
    cy.get(selectors.list.filteredRow.nameColumn()).should('have.text', credentialName)
    cy.get(selectors.list.filteredRow.lastEditorColumn).should(
      'have.text',
      Cypress.env('CYPRESS_EMAIL_STAGE')
    )
    cy.get(selectors.list.filteredRow.lastModifiedColumn).should('not.be.empty')
    cy.get(selectors.list.filteredRow.statusColumn).should('have.text', 'Active')
  })
  afterEach(() => {
    // Delete the credential
    cy.deleteProduct(credentialName, '/credentials')
  })
})
