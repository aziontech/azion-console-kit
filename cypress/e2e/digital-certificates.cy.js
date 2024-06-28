import generateUniqueName from '../support/utils'

const selectors = {
  list: {
    breadcumbReturnToList: ':nth-child(3) > .p-menuitem-link',
    createDigitalCertificateButton: '[data-testid="create_Digital Certificate_button"]',
    searchInput: '[data-testid="data-table-search-input"]',
    filteredRow: {
      nameColumn: '[data-testid="list-table-block__column__name__row"]',
      statusColum: '[data-testid="list-table-block__column__status__row"] > .p-tag-value'
    },
    actionsMenu: {
      button: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
      deleteAction: '.p-menuitem-content > .p-menuitem-link'
    },
    deleteDialog: {
      confirmationInputField: '[data-testid="delete-dialog-confirmation-input-field"]',
      deleteButton: '[data-testid="delete-dialog-footer-delete-button"]',
      confirmInput: '#confirm-input'
    }
  },
  form: {
    digitalCertificateName: '[data-testid="digital-certificate__name-field"]',
    submitButton: '[data-testid="form-actions-submit-button"]',
    editPageTitle: '[data-testid="page_title_Edit Digital Certificate"]'
  }
}

const digitalCertificateName = generateUniqueName('Digital Certificate')

describe('Digital Certificates spec', () => {
  beforeEach(() => {
    cy.login()
    cy.openProductThroughSidebar('digital-certificates')
  })

  it('should create and delete a new digital certificate', function () {
    // Arrange
    cy.get(selectors.list.createDigitalCertificateButton).click()

    // Act
    cy.get(selectors.form.digitalCertificateName).clear()
    cy.get(selectors.form.digitalCertificateName).type(digitalCertificateName)
    cy.get(selectors.form.submitButton).click()

    // Assert
    cy.verifyToast('successYour digital certificate has been created!')
    cy.get(selectors.form.editPageTitle).should('have.text', 'Edit Digital Certificate')
    cy.get(selectors.list.breadcumbReturnToList).click()
    cy.get(selectors.list.searchInput).clear()
    cy.get(selectors.list.searchInput).type(digitalCertificateName)
    cy.get(selectors.list.filteredRow.nameColumn).should('have.text', digitalCertificateName)
    cy.get(selectors.list.filteredRow.statusColum).should('have.text', 'Pending')

    // Cleanup
    cy.get(selectors.list.actionsMenu.button).click()
    cy.get(selectors.list.actionsMenu.deleteAction).click()
    cy.get(selectors.list.deleteDialog.confirmInput).clear()
    cy.get(selectors.list.deleteDialog.confirmInput).type('delete{enter}')
    cy.verifyToast('Digital certificate successfully deleted!')
  })
})
