const selectors = {
  list: {
    createServiceButton: '[data-testid="create_Service_button"] > .p-button-label',
    searchInput: '[data-testid="data-table-search-input"]',
    filteredRow: {
      nameColumn: '[data-testid="list-table-block__column__name__row"]',
      statusColumn: '[data-testid="list-table-block__column__labelActive__row"] > .p-tag-value'
    },
    actionsMenu: {
      button: '[data-testid="data-table-actions-column-body-actions-menu-button"] > .p-button-icon',
      deleteAction: '#overlay_menu_1 > .p-menuitem-content > .p-menuitem-link > .p-menuitem-text'
    },
    deleteDialog: {
      confirmationInputField: '[data-testid="delete-dialog-confirmation-input-field"]'
    }
  },
  form: {
    serviceName: '[data-testid="edge-service-form__name-field"]',
    nameRequiredLabel: '[data-testid="edge-service-form__name-field-error-message"]',
    submitButton: '[data-testid="form-actions-submit-button"]',
    pageTitle: '[data-testid="page_title_EntityName"]',
    cancelButton: '[data-testid="form-actions-cancel-button"] > .p-button-label'
  },
  toast: {
    createSuccessMessage: ':nth-child(2) > .p-toast-message-content > .flex-column > .text-sm'
  }
}

describe('template spec', () => {
  beforeEach(() => {
    cy.login()
    cy.openProductThroughSidebar('edge-services')
  })

  it('should create and delete an edge service', () => {
    // Arrange
    cy.get(selectors.list.createServiceButton).click()

    // Act
    cy.get(selectors.form.serviceName).type('TestRequired')
    cy.get(selectors.form.serviceName).clear()
    cy.get(selectors.form.nameRequiredLabel).should('have.text', 'Name is a required field')
    cy.get(selectors.form.serviceName).type('EntityName')
    cy.get(selectors.form.submitButton).click()

    // Assert
    cy.get(selectors.toast.createSuccessMessage).should(
      'have.text',
      'Your Edge Service has been created'
    )
    cy.get(selectors.form.pageTitle).should('have.text', 'EntityName')
    cy.get(selectors.form.cancelButton).click()
    cy.get(selectors.list.searchInput).type('EntityName')
    cy.get(selectors.list.filteredRow.nameColumn).should('have.text', 'EntityName')

    cy.get(selectors.list.filteredRow.statusColumn).should('have.text', 'Inactive')

    // Cleanup
    cy.get(selectors.list.actionsMenu.button).click()
    cy.get(selectors.list.actionsMenu.deleteAction).click()
    cy.get(selectors.list.deleteDialog.confirmationInputField).clear()
    cy.get(selectors.list.deleteDialog.confirmationInputField).type('delete{enter}')
  })
})
