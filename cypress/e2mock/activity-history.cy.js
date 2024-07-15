import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

let networkListName = generateUniqueName('NetworkList')
const fixtures = {
  queryResponse: {
    data: {
      activityHistoryEvents: [
          {
              ts: "2024-07-15T16:45:51Z",
              title: `Network List ${networkListName} was created`,
              comment: "-",
              type: "created",
              authorName: "teste",
              authorEmail: "teste@gmail.com",
              accountId: ""
          },
      ]
  }
  }
}
describe('Activity History Spec', () => {
  beforeEach(() => {
    cy.login()
  })

  it('should registry when a network list is created', function () {

    //Arrange
    cy.intercept('POST', '/api/v3/events/graphql', { statusCode: 200, body: fixtures.queryResponse }).as('activityHistoryApi')
    cy.openProduct('Activity History')

    //act
    cy.get(selectors.activityHistory.searchInput).clear()
    cy.get(selectors.activityHistory.searchInput).type(`${networkListName} was created`)

    //assert
    cy.get(selectors.activityHistory.timeLineEvent).should('have.text', fixtures.queryResponse.data.activityHistoryEvents[0].title)
  })
})
