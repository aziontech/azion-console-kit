import selectors from '../support/selectors'

describe('Activity History Spec', { tags: ['@dev2'] }, () => {
  beforeEach(() => {
    cy.loginMock()
    cy.intercept('POST', 'v4/events/graphql', { fixture: 'activity-history.json' }).as(
      'activityHistoryApi'
    )
    cy.openProduct('Activity History')

    // Landing assertion: the table toolbar (search input) is rendered.
    cy.get(selectors.activityHistory.searchInput).should('be.visible')
  })

  it('should list a recorded activity returned by the API', function () {
    cy.get(selectors.activityHistory.searchInput).clear()
    cy.get(selectors.activityHistory.searchInput).type('Network List{enter}')

    cy.contains('teste@gmail.com').should('be.visible')
  })
})
