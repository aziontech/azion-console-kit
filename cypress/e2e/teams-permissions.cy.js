import generateUniqueName from '../support/utils';
import selectors from '../support/selectors';

const teamsPermissionsName = generateUniqueName('TeamName')

describe('Teams Permissions', () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Teams Permissions');
  })

  it('should create a new team', () => {
    // Arrange
    cy.get(selectors.list.searchField).type(teamsPermissionsName)
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
    cy.get(selectors.form.teamName).type(teamsPermissionsName)
    cy.get(selectors.form.allPermissionsToTarget).click()
    cy.get(selectors.form.actionsSubmitButton).should('be.enabled')

    cy.get(selectors.form.allPermissionsToSource).click()

    cy.get(selectors.form.viewContentDeliverySettingsPermission).click()
    cy.get(selectors.form.singlePermissionToTarget).click()
    cy.get(selectors.form.actionsSubmitButton).should('be.enabled')

    cy.get(selectors.form.allPermissionsToTarget).click()
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.get(selectors.toast.content)
      .should('be.visible')
      .and('contain', 'successYour Team Permission has been created')

    cy.get(selectors.form.actionsCancelButton).click()

    cy.get(selectors.list.searchField).type(teamsPermissionsName)
    cy.get(selectors.list.filteredRow.nameColumn()).should('have.text', teamsPermissionsName)
    cy.get(selectors.list.filteredRow.permissionsColumn).should(
      'have.text',
      'View Content Delivery SettingsEdit Content Delivery SettingsShow more (46)'
    )
    cy.get(selectors.list.filteredRow.statusColumn).should('have.text', 'Active')
  })

  afterEach(() => {
    // Delete the team permissions
    cy.deleteProduct({ entityName: teamsPermissionsName, productName: 'Teams Permissions' })
  })
})
