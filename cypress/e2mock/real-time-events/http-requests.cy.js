import loadHttpRequestsSecond from '../../fixtures/real-time-events/load-http-requests-second.json'
import loadHttpRequests from '../../fixtures/real-time-events/load-http-requests.json'
import listHttpRequests from '../../fixtures/real-time-events/list-http-requests.json'

describe('HTTP Events - E2E', () => {
  let fisrtRender = true
  beforeEach(() => {
    cy.login()
    cy.openProduct('Real-Time Events')

    cy.intercept('POST', '/v4/events/graphql', (req) => {
      if (req.body && req.body.variables?.and_requestIdEq) {
        if (fisrtRender) {
          req.reply(loadHttpRequests)
          fisrtRender = false
        } else {
          req.reply(loadHttpRequestsSecond)
          fisrtRender = true
        }
      } else {
        req.reply(listHttpRequests)
      }
    }).as('httpEventsRequest')
  })

  it('should open the drawer with the details and should contain the wafEvheaders field with the copy button', () => {
    cy.wait('@httpEventsRequest')
    cy.get('[data-testid="table-body-row"] > :nth-child(1)').click()
    cy.wait('@httpEventsRequest')
    cy.get('[data-testid="data-table-search-input"]').clear()
    cy.get('[data-testid="data-table-search-input"]').type('wafEvheaders')
    cy.get('[data-testid="data-table-copy-button"]').click()

    cy.verifyToast('Success', 'Successfully copied!')
  })
})
