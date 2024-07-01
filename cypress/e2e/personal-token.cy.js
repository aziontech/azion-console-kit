import generateUniqueName from '../support/utils'

const selectors = {
  list: {
    createTokenButton: '[data-testid="create_Personal Token_button"]',
    searchInput: '[data-testid="data-table-search-input"]',
    filteredRecord: {
      nameColumn: '[data-testid="list-table-block__column__name__row"]',
      menuButton: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
      deleteButton: '.p-menuitem-content > .p-menuitem-link'
    },
    deleteDialog: {
      confirmationInputField: '[data-testid="delete-dialog-confirmation-input-field"]'
    }
  },
  form: {
    tokenName: '[data-testid="personal-token-form__name-field__input"]',
    submitButton: '[data-testid="form-actions-submit-button"]',
    copyTokenDialogHeader: '[data-testid="copy-token-dialog__header"] > .p-dialog-header',
    copyTokenButton: '[data-testid="copy-token-dialog__token-field__copy-token-button"]',
    closeCopyDialogButton: '[data-testid="copy-token-dialog__dialog-footer__confirm-button"]'
  }
}

const personalTokenName = generateUniqueName('Personal Token')

describe('Personal Token spec', () => {
  beforeEach(() => {
    cy.login()
    cy.openItemThroughMenuAccount('Personal Token')
  })

  it('should create and delete a personal token', () => {
    // Arrange
    cy.get(selectors.list.createTokenButton).click()
    cy.get(selectors.form.tokenName).type(personalTokenName)

    // Act
    // Verify if copy token dialog is displayed after save
    cy.get(selectors.form.submitButton).click()
    cy.get(selectors.form.copyTokenDialogHeader).should(
      'have.text',
      'Personal token has been created'
    )
    cy.get(selectors.form.copyTokenButton).click()
    cy.verifyToast('Personal Token copied to clipboard!')
    cy.get(selectors.form.closeCopyDialogButton).click()

    // Assert
    cy.get(selectors.list.searchInput).type(personalTokenName)
    cy.get(selectors.list.filteredRecord.nameColumn).should('have.text', personalTokenName)

    // Cleanup
    cy.get(selectors.list.filteredRecord.menuButton).click()
    cy.get(selectors.list.filteredRecord.deleteButton).click()
    cy.get(selectors.list.deleteDialog.confirmationInputField).clear()
    cy.get(selectors.list.deleteDialog.confirmationInputField).type('delete{enter}')
    cy.verifyToast('Personal token successfully deleted')
  })
})
