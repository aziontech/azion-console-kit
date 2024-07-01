import generateUniqueName from '../support/utils'

const selectors = {
  list: {
    createServiceButton: '[data-testid="create_Service_button"]',
    searchInput: '[data-testid="data-table-search-input"]',
    filteredRow: {
      nameColumn: '[data-testid="list-table-block__column__name__row"]',
      statusColumn: '[data-testid="list-table-block__column__labelActive__row"] > .p-tag-value'
    },
    actionsMenu: {
      button: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
      deleteAction: '#overlay_menu_1 > .p-menuitem-content > .p-menuitem-link > .p-menuitem-text'
    },
    deleteDialog: {
      confirmationInputField: '[data-testid="delete-dialog-confirmation-input-field"]'
    }
  },
  form: {
    serviceName: '[data-testid="edge-service-form__name-field__input"]',
    nameRequiredLabel: '[data-testid="edge-service-form__name-field__error-message"]',
    submitButton: '[data-testid="form-actions-submit-button"]',
    pageTitle: (entityName) => `[data-testid="page_title_${entityName}"]`,
    cancelButton: '[data-testid="form-actions-cancel-button"]'
  }
}

const edgeServiceName = generateUniqueName('EdgeService')

describe('template spec', () => {
  beforeEach(() => {
    cy.login()
    cy.openProductThroughSidebar('edge-services')
  })

  it('should create and delete an edge service', () => {
    // Arrange
    cy.get(selectors.list.createServiceButton).click()

    // Act
    cy.get(selectors.form.serviceName).type(edgeServiceName)
    cy.get(selectors.form.submitButton).click()

    // Assert
    cy.verifyToast('success', 'Your Edge Service has been created')
    cy.get(selectors.form.pageTitle(edgeServiceName)).should('have.text', edgeServiceName)
    cy.get(selectors.form.cancelButton).click()
    cy.get(selectors.list.searchInput).type(edgeServiceName)
    cy.get(selectors.list.filteredRow.nameColumn).should('have.text', edgeServiceName)

    cy.get(selectors.list.filteredRow.statusColumn).should('have.text', 'Inactive')

    // Cleanup
    cy.get(selectors.list.actionsMenu.button).click()
    cy.get(selectors.list.actionsMenu.deleteAction).click()
    cy.get(selectors.list.deleteDialog.confirmationInputField).clear()
    cy.get(selectors.list.deleteDialog.confirmationInputField).type('delete{enter}')
    cy.verifyToast('Resource successfully deleted')
  })
})
