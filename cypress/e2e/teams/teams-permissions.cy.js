import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let teamsPermissionsName

describe('Teams Permissions', () => {
  beforeEach(() => {
    teamsPermissionsName = generateUniqueName('Team')
    cy.login()
    cy.openProduct('Teams Permissions')

    cy.intercept('api/v4/iam/permissions*').as('loadPermissions')
  })

  it('should create a new team', () => {
    // Arrange
    cy.get(selectors.teams.createTeamButton).click()
    cy.get(selectors.teams.nameInput).clear()

    // // Act
    // Test different permissions scenarios and verify whether form is enabled/disabled
    cy.get(selectors.teams.nameInput).type(teamsPermissionsName)

    cy.wait('@loadPermissions')

    cy.get(selectors.teams.allPermissionsToTarget).click()
    cy.get(selectors.teams.allPermissionsToSource).click()
    cy.get(selectors.teams.permission('View Content Delivery Settings')).click()
    cy.get(selectors.teams.singlePermissionToTarget).click()
    cy.get(selectors.teams.allPermissionsToTarget).click()

    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.verifyToast('success', 'Your Team Permission has been created')

    cy.get(selectors.form.actionsCancelButton).click()

    cy.get(selectors.list.searchField).type(teamsPermissionsName)
    cy.get(selectors.teams.listRow('name')).should('have.text', teamsPermissionsName)
    cy.get(selectors.teams.listRow('permissions')).should(
      'have.text',
      'View Content Delivery SettingsEdit Content Delivery SettingsShow more (47)'
    )
    cy.get(selectors.teams.listRow('status')).should('have.text', 'Active')
  })

  it('should create a new team with view permissions only', () => {
    // Arrange
    const viewPermissionsFixtures = [
      'View Content Delivery Settings',
      'View Real-Time Analytics',
      'View Security Settings',
      'View Subscriptions',
      'View Payment Methods',
      'View Bills',
      'View Edge Applications',
      'View Domains',
      'View Real-Time Events',
      'View Users',
      'View Edge DNS',
      'View Data Stream',
      'View Network Lists',
      'View Edge Firewall',
      'View Edge Functions',
      'View client list',
      'View Storage Bucket',
      'View Storage Object',
      'View Storage Credentials',
      'View VCS Integrations',
      'View VCS Continuous Deployment'
    ]

    cy.get(selectors.teams.createTeamButton).click()
    cy.get(selectors.teams.nameInput).clear()

    // // Act
    cy.get(selectors.teams.nameInput).type(teamsPermissionsName)

    viewPermissionsFixtures.forEach((permission) => {
      cy.get(selectors.teams.permission(permission)).dblclick()
    })

    cy.get(selectors.teams.sourceList).should('not.contain', 'View', {
      matchCase: false
    })

    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.verifyToast('success', 'Your Team Permission has been created')

    cy.get(selectors.form.actionsCancelButton).click()

    cy.get(selectors.list.searchField).type(teamsPermissionsName)
    cy.get(selectors.teams.listRow('name')).should('have.text', teamsPermissionsName)
    cy.get(selectors.teams.listRow('permissions')).should(
      'have.text',
      'View Content Delivery SettingsView Real-Time AnalyticsShow more (19)'
    )
    cy.get(selectors.teams.listRow('status')).should('have.text', 'Active')
  })

  afterEach(() => {
    // Delete the team permissions
    cy.deleteEntityFromLoadedList()
  })
})
