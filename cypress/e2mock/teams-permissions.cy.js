import selectors from '../support/selectors'

const fixtures = {
  errorMessage: {
    detail: 'You do not have permission to perform this action (teams management).'
  }
}
describe('Teams Permissions Spec', { tags: ['@dev2'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Ten Permissions')
  })

  it('should block users without access of entering in the edit page', function () {
    //act
    cy.get(selectors.list.searchField).type('Default Team')
    cy.intercept('GET', '/api/v4/iam/teams/*', { statusCode: 403, body: fixtures.errorMessage }).as(
      'teamsPermissions'
    )
    cy.get(selectors.teams.listRow('name')).click()

    //assert
    cy.verifyToast('error', fixtures.errorMessage.detail)
    cy.location('pathname').should('eq', '/teams-permission')
  })
})
