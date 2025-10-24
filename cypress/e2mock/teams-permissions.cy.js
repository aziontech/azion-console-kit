import selectors from '../support/selectors'

const fixtures = {
  listTeamsPermissions: {
    count: 1,
    results: [
      {
        id: 25016,
        name: 'Default Team1',
        permissions: [
          {
            id: 1,
            name: 'View Content Delivery Settings',
            slug: 'content_delivery:read',
            group: 'default_permissions'
          }
        ],
        is_active: true
      }
    ]
  },
  errorMessage: {
    detail: 'You do not have permission to perform this action (teams management).'
  }
}

describe('Teams Permissions Spec', { tags: ['@dev2'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.intercept('GET', '/api/v4/iam/teams?*', {
      statusCode: 200,
      body: fixtures.listTeamsPermissions
    }).as('listTeamsPermissions')
    cy.openProduct('Teams Permissions')
  })

  it('should block users without access of entering in the edit page', () => {
    //act
    cy.get(selectors.list.searchField).type('Default Team {enter}')
    cy.wait('@listTeamsPermissions')
    cy.intercept('GET', '/api/v4/iam/teams/25016', {
      statusCode: 403,
      body: fixtures.errorMessage
    }).as('getTeamPermissions')

    cy.get(selectors.teams.listRow('name')).click()
    cy.wait('@getTeamPermissions')
    
    //assert
    cy.verifyToast('error', fixtures.errorMessage.detail)
    cy.location('pathname').should('eq', '/teams-permission')
  })
})
