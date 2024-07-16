import selectors from '../support/selectors'
import fixtures from '../fixtures/activity-history.json'


describe('Activity History Spec', () => {
  beforeEach(() => {
    cy.login()
    cy.intercept('POST', '/api/v3/events/graphql', { fixture: 'activity-history.json' }).as('activityHistoryApi')
    cy.openProduct('Activity History')
  })

  it('should registry when a network list is created', function () {
    //act
    cy.get(selectors.activityHistory.searchInput).clear()
    cy.get(selectors.activityHistory.searchInput).type(fixtures.data.activityHistoryEvents[0].title)

    //assert
    cy.get(selectors.activityHistory.timeLineEvent).should(
      'have.text',
      fixtures.data.activityHistoryEvents[0].title
    )
  })
})
