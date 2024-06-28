import generateUniqueName from '../support/utils'

const selectors = {
  list: {
    createCredentialBtn: '[data-testid="create_Credential_button"]',
    searchInput: '[data-testid="data-table-search-input"]',
    filteredRow: {
      nameColumn: '[data-testid="list-table-block__column__name__row"]',
      lastEditorColumn: '[data-testid="list-table-block__column__lastEditor__row"]',
      lastModifiedColumn: '[data-testid="list-table-block__column__lastModified__row"]',
      statusColumn: '[data-testid="list-table-block__column__status__row"]',
      empty: 'tr.p-datatable-emptymessage > td',
      actionsMenu: {
        button: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
        deleteAction: '.p-menuitem-content > .p-menuitem-link'
      }
    },
    deleteDialog: {
      confirmationInputField: '[data-testid="delete-dialog-confirmation-input-field"]',
      deleteButton: '[data-testid="delete-dialog-footer-delete-button"]'
    }
  },
  form: {
    nameInput: '[data-testid="credentials-create-form__name-field__input"]',
    nameErrorText: '[data-testid="credentials-create-form__name-field__error-text"]',
    descriptionField: '[data-testid="credentials-create-form__description-field__textarea"]',
    tokenInput: '[data-testid="credentials-create-form__token-field__input"]',
    tokenErrorText: '[data-testid="credentials-create-form__token-field__error-text"]',
    tokenCopyButton: '[data-testid="credentials-create-form__token-field__copy-token-button"]',
    statusSwitch: '[data-testid="credentials-create-form__status-field__switch"]',
    actionsSubmitButton: '[data-testid="form-actions-submit-button"]',
    actionsCancelButton: '[data-testid="form-actions-cancel-button"]'
  }
}

const credentialName = generateUniqueName('Credential')

describe('Credentials', () => {
  beforeEach(() => {
    cy.login()
    cy.openMenuItem('Credentials')
  })

  it('should create a credential from the table', () => {
    // Arrange
    cy.get(selectors.list.createCredentialBtn).click()

    cy.get(selectors.form.nameInput).type('N')
    cy.get(selectors.form.nameInput).clear()
    cy.get(selectors.form.nameErrorText)
      .should('be.visible')
      .and('have.text', 'Name is a required field')

    cy.get(selectors.form.tokenCopyButton).should('be.disabled')

    cy.get(selectors.form.statusSwitch).should('have.class', 'p-inputswitch-checked')

    cy.get(selectors.form.actionsSubmitButton).should('be.disabled')

    // Act
    cy.get(selectors.form.nameInput).type(credentialName)
    cy.get(selectors.form.descriptionField).type('New Credential Description')
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.verifyToast('successYour credential token has been created')

    cy.get(selectors.form.tokenCopyButton).click()
    cy.verifyToast('token copied')

    cy.get(selectors.form.actionsCancelButton).click()

    cy.get(selectors.list.searchInput).type(credentialName)
    cy.get(selectors.list.filteredRow.nameColumn).should('have.text', credentialName)
    cy.get(selectors.list.filteredRow.lastEditorColumn).should(
      'have.text',
      Cypress.env('CYPRESS_EMAIL_STAGE')
    )
    cy.get(selectors.list.filteredRow.lastModifiedColumn).should('not.be.empty')
    cy.get(selectors.list.filteredRow.statusColumn).should('have.text', 'Active')

    // Cleanup
    cy.get(selectors.list.filteredRow.actionsMenu.button).click()
    cy.get(selectors.list.filteredRow.actionsMenu.deleteAction).click()
    cy.get(selectors.list.deleteDialog.confirmationInputField).type('delete')
    cy.get(selectors.list.deleteDialog.deleteButton).click()
    cy.verifyToast('Credential successfully deleted')
  })
})
