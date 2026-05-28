/* eslint-disable cypress/no-unnecessary-waiting */
/**
 * Task 15.3 + 10.5* — E2E All 5 Problematic Datasets Load Without GraphQL Error
 *
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**
 *
 * For each of the 5 datasets that historically failed with
 * "Cannot query field" GraphQL errors when an unsupported groupBy
 * was sent, this suite asserts:
 *
 *   1. The tab/dataset loads without an error toast.
 *   2. Either a chart renders or the empty-state is shown — both are
 *      success outcomes; a GraphQL 400/error response is the failure.
 *   3. The GraphQL request that was actually fired uses
 *      `groupBy: [ts]` only (no unsupported field).
 *
 * Datasets covered:
 *   - functionEvents
 *   - functionConsoleEvents
 *   - dataStreamedEvents
 *   - edgeDnsQueriesEvents
 *   - activityHistoryEvents
 *
 * Tagged `@xfail` until selectors / tab navigation are confirmed
 * against the dev environment.
 */
const DATASET_TABS = [
  {
    dataset: 'functionEvents',
    label: 'Function Events',
    testid: '[data-testid="rte-tab-function-events"]'
  },
  {
    dataset: 'functionConsoleEvents',
    label: 'Function Console Events',
    testid: '[data-testid="rte-tab-function-console-events"]'
  },
  {
    dataset: 'dataStreamedEvents',
    label: 'Data Stream Events',
    testid: '[data-testid="rte-tab-data-stream-events"]'
  },
  {
    dataset: 'edgeDnsQueriesEvents',
    label: 'Edge DNS Queries',
    testid: '[data-testid="rte-tab-edge-dns-queries"]'
  },
  {
    dataset: 'activityHistoryEvents',
    label: 'Activity History',
    testid: '[data-testid="rte-tab-activity-history"]'
  }
]

const TOAST_ERROR = '.p-toast-message-error'
const CHART_OR_EMPTY = '[data-testid="rte-chart"], [data-testid="rte-empty-state"]'

describe(
  'Real-Time Events · All 5 Problematic Datasets Load (Task 15.3, 10.5*)',
  { tags: ['@dev3', '@xfail'] },
  () => {
    beforeEach(() => {
      cy.login()
      cy.openProduct('Real-Time Events')
      cy.intercept('POST', '/v4/events/graphql').as('graphqlEvents')
    })

    DATASET_TABS.forEach(({ label, testid }) => {
      it(`loads ${label} without GraphQL error toast and uses groupBy:[ts] only`, () => {
        cy.get(testid).click()
        cy.wait('@graphqlEvents').then((intercept) => {
          const body =
            typeof intercept.request.body === 'string'
              ? JSON.parse(intercept.request.body)
              : intercept.request.body
          const query = body?.query || ''

          // Property P3 — the query must NOT use an unsupported groupBy.
          // For these 5 datasets the supported set is empty → groupBy must
          // be `[ts]` only or absent.
          expect(query).to.match(/groupBy:\s*\[ts\]/)
          // Specifically forbid `status` / `requestMethod` from sneaking in.
          expect(query).not.to.match(/groupBy:\s*\[ts,\s*status\]/)
          expect(query).not.to.match(/groupBy:\s*\[ts,\s*requestMethod\]/)

          // The response was a non-error status code.
          expect(intercept.response.statusCode).to.be.lessThan(400)
        })

        // No error toast surfaced to the user.
        cy.get(TOAST_ERROR).should('not.exist')

        // Either a chart rendered or an empty state — anything but an error.
        cy.get(CHART_OR_EMPTY).should('exist')
      })
    })

    // Task 11.2* — User-facing error message when GraphQL is unreachable.
    it('shows a friendly error toast when the GraphQL endpoint is blocked (Task 11.2*)', () => {
      cy.intercept('POST', '/v4/events/graphql', { statusCode: 500, body: {} }).as('graphqlFail')

      cy.get(DATASET_TABS[0].testid).click()
      cy.wait('@graphqlFail')

      cy.get(TOAST_ERROR)
        .should('be.visible')
        .and(
          'contain.text',
          // Friendly text per Decision 7.5 — no raw error in the toast.
          'Error loading events'
        )

      // The raw error is logged to console for debugging (window.console.error
      // calls during the test are not captured directly by Cypress, but the
      // contract is documented in load-events-aggregation.js).
    })
  }
)
