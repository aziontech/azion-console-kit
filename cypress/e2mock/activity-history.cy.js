import selectors from '../support/selectors'


describe('Activity History Spec', { tags: ['@dev2'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.intercept('POST', '/api/v3/events/graphql', { fixture: 'activity-history.json' }).as('activityHistoryApi')
    cy.openProduct('Activity History')
  })

  it('should registry when a network list is created', function () {
    //act
    cy.get(selectors.activityHistory.searchInput).clear()
    cy.get(selectors.activityHistory.searchInput).type('Network List NetworkListTest was created')

    //assert
    cy.get(selectors.activityHistory.timeLineEvent).should(
      'have.text',
      'Network List NetworkListTest was created'
    )
  })
})
