import { getCurrentMonthStartEnd } from '../../../src/helpers/get-current-month-start-end'
describe('Billing spec', { tags: ['@dev2'] }, () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/account/info', {
      fixture: '/account/info/trial_account.json'
    }).as('getAccountInfo')
    cy.login()
    cy.wait('@getAccountInfo')
  })

  it('should use correct query to get the current invoice', () => {
    const dateRange = getCurrentMonthStartEnd()

    const expectedQuery = `query getBillDetail {
      billDetail(
          limit: 1,
          aggregate: { sum: value }
          groupBy: [billId]
          orderBy: [productSlug_ASC, metricSlug_ASC]
          filter: {
            periodFromRange: {
              begin: "${dateRange.dateInitial}", end: "${dateRange.dateFinal}"
            }
          }
      ) {
          billId,
          billDetailId,
          createdDate,
          periodFrom,
          periodTo,
          invoiceNumber,
          totalValue,
          currency,
          temporaryBill
      }
    }`
      .replace(/\s+/g, ' ')
      .trim()

    cy.intercept('POST', '/v4/billing/graphql', { statusCode: 200, body: {} }).as('billingRequests')

    cy.visit('/billing')

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(5000)

    cy.get('@billingRequests.all').then((interceptions) => {
      const hasCorrectQuery = interceptions.some((interception) => {
        if (interception.request && interception.request.body && interception.request.body.query) {
          const normalizedActual = interception.request.body.query.replace(/\s+/g, ' ').trim()
          return normalizedActual.includes(expectedQuery)
        }
        return false
      })

      expect(hasCorrectQuery).to.be.true
    })
  })
})
