import generateUniqueName from '../support/utils'

const selectors = {
  list: {
    createTeamButton: '[data-testid="create_Team_button"]',
    searchField: '[data-testid="data-table-search-input"]',
    filteredRow: {
      nameColumn: '.p-selectable-row > :nth-child(1)',
      permissionsColumn: '.p-selectable-row > :nth-child(2)',
      statusColumn: '.p-selectable-row > :nth-child(3)',
      empty: 'tr.p-datatable-emptymessage > td'
    },
    actionsMenu: {
      button: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
      deleteAction: '.p-menuitem-content > .p-menuitem-link'
    },
    deleteDialog: {
      confirmationInputField: '[data-testid="delete-dialog-confirmation-input-field"]',
      deleteButton: '[data-testid="delete-dialog-footer-delete-button"]'
    }
  },
  form: {
    teamName: '[data-testid="teams-permissions-form__name__field-text__input"]',
    teamNameError: '[data-testid="teams-permissions-form__name__field-text__error-message"]',
    teamStatus: '[data-testid="teams-permissions-form__form-fields__status"]',
    allPermissionsToTarget: '[aria-label="Move All to Target"] > .p-icon',
    allPermissionsToSource: '[aria-label="Move All to Source"] > .p-icon',
    singlePermissionToTarget: 'button[aria-label="Move to Target"]',
    viewContentDeliverySettingsPermission:
      '[data-testid="teams-permissions-form__permissions-field__picklist__item-View Content Delivery Settings"]',

    actionsSubmitButton: '[data-testid="form-actions-submit-button"]',
    actionsCancelButton: '[data-testid="form-actions-cancel-button"]'
  }
}

const teamName = generateUniqueName('Team')

describe('Teams Permissions', () => {
  beforeEach(() => {
    cy.login()
    cy.openMenuItem('Teams Permissions')
  })

  it('should create a new team', () => {
    // Arrange
    cy.get(selectors.list.searchField).type(teamName)
    cy.get(selectors.list.filteredRow.empty)
      .should('be.visible')
      .and('have.text', 'No teams found.')

    cy.get(selectors.list.createTeamButton).click()

    cy.get(selectors.form.teamName).type('A')
    cy.get(selectors.form.teamName).clear()
    cy.get(selectors.form.teamNameError)
      .should('be.visible')
      .and('have.text', 'Name is a required field')

    // Act
    // Test different permissions scenarios and verify whether form is enabled/disabled
    cy.get(selectors.form.teamName).type(teamName)
    cy.get(selectors.form.allPermissionsToTarget).click()
    cy.get(selectors.form.actionsSubmitButton).should('be.enabled')

    cy.get(selectors.form.allPermissionsToSource).click()

    cy.get(selectors.form.viewContentDeliverySettingsPermission).click()
    cy.get(selectors.form.singlePermissionToTarget).click()
    cy.get(selectors.form.actionsSubmitButton).should('be.enabled')

    cy.get(selectors.form.allPermissionsToTarget).click()
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.verifyToast('success', 'Your Team Permission has been created')
    cy.get(selectors.form.actionsCancelButton).click()

    cy.get(selectors.list.searchField).type(teamName)
    cy.get(selectors.list.filteredRow.nameColumn).should('have.text', teamName)
    cy.get(selectors.list.filteredRow.permissionsColumn).should(
      'have.text',
      'View Content Delivery SettingsEdit Content Delivery SettingsShow more (46)'
    )
    cy.get(selectors.list.filteredRow.statusColumn).should('have.text', 'Active')

    // Cleanup
    cy.get(selectors.list.actionsMenu.button).click()
    cy.get(selectors.list.actionsMenu.deleteAction).click()

    cy.get(selectors.list.deleteDialog.confirmationInputField).type('delete')
    cy.get(selectors.list.deleteDialog.deleteButton).click()

    cy.get(selectors.list.searchField).clear()
    cy.get(selectors.list.searchField).type(teamName)
    cy.get(selectors.list.filteredRow.empty)
      .should('be.visible')
      .and('have.text', 'No teams found.')
    cy.verifyToast('Team Permission successfully deleted')
  })
})
