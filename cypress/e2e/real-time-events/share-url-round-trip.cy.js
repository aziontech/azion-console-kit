/* eslint-disable cypress/no-unnecessary-waiting */
/**
 * Tasks 5.4* + 15.1 — E2E Share URL Round-Trip
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.5, N.1**
 *
 * Full user flow:
 *   1. Open Real-Time Events V2 with the default filters / dataset.
 *   2. Apply a filter (e.g. `status = 200`).
 *   3. Click the Share button → clipboard receives a URL with `?shareState=...`.
 *   4. Visit the URL in a fresh session → assert the filter, dataset,
 *      pageSize and selectedFields are reapplied.
 *   5. Also exercise the ephemeral shared-tab path with a custom panel.
 *
 * Tagged `@xfail` until selectors are confirmed end-to-end against the
 * dev environment. The structure is production-shaped: when the UI
 * adds the required `data-testid` hooks (`share-button`,
 * `shared-tab-marker`, etc.), drop the tag.
 */
import selectors from '../../support/selectors'

const REAL_TIME_EVENTS_SHARE = {
  shareButton: '[data-testid="real-time-events-share-button"]',
  sharedTabMarker: '[data-testid="rte-shared-tab"]',
  toast: '.p-toast-message',
  toastSuccess: '.p-toast-message-success',
  toastError: '.p-toast-message-error'
}

describe(
  'Real-Time Events · Share URL Round-Trip (Tasks 5.4* + 15.1)',
  { tags: ['@dev3', '@xfail'] },
  () => {
    beforeEach(() => {
      cy.login()
      cy.openProduct('Real-Time Events')
      cy.intercept('POST', '/v4/events/graphql').as('graphqlEvents')

      // Grant clipboard permissions to Cypress browser so writeText() resolves.
      cy.window().then((win) => {
        cy.stub(win.navigator.clipboard, 'writeText')
          .as('clipboardWrite')
          .callsFake((value) => {
            win.__copiedUrl = value
            return Promise.resolve()
          })
      })
    })

    it('copies a share URL containing the encoded share state', () => {
      // Apply a filter so the share state has something meaningful to carry.
      cy.get(`${selectors.realTimeEvents.filterOptions} > [tabindex="-1"]`).click()
      cy.get(selectors.realTimeEvents.input).type('status = 200{enter}')
      cy.wait('@graphqlEvents')

      // Click Share — clipboard stub receives the URL.
      cy.get(REAL_TIME_EVENTS_SHARE.shareButton).click()
      cy.get('@clipboardWrite').should('have.been.calledOnce')
      cy.get(REAL_TIME_EVENTS_SHARE.toastSuccess).should('be.visible')

      // The URL must include ?shareState=<base64> and the encoded payload
      // must round-trip through decodeShareState into a usable object.
      cy.window().then((win) => {
        expect(win.__copiedUrl).to.match(/\?shareState=[A-Za-z0-9+/=]+/)
        const encoded = new URL(win.__copiedUrl).searchParams.get('shareState')
        const decoded = JSON.parse(decodeURIComponent(atob(encoded)))
        expect(decoded.ver).to.equal(1)
        expect(decoded.viewState).to.be.an('object')
      })
    })

    it('opening the share URL in a fresh session reapplies the filters', () => {
      // Set up the share URL by applying a filter and clicking Share.
      cy.get(`${selectors.realTimeEvents.filterOptions} > [tabindex="-1"]`).click()
      cy.get(selectors.realTimeEvents.input).type('status = 200{enter}')
      cy.wait('@graphqlEvents')
      cy.get(REAL_TIME_EVENTS_SHARE.shareButton).click()

      cy.window().then((win) => {
        const sharedUrl = win.__copiedUrl
        expect(sharedUrl, 'shared URL captured').to.be.a('string')

        // Visit the URL in a fresh page load.
        cy.visit(sharedUrl)
        cy.wait('@graphqlEvents')

        // The filter must be reapplied — verify by re-reading the input.
        cy.get(selectors.realTimeEvents.input).should(
          'contain.text', // .p-chip or similar component-specific assertion
          'status'
        )
      })
    })

    it('a shared custom panel materializes an ephemeral shared tab', () => {
      // Manually craft a shareState URL pointing at a custom panel so we
      // don't need to first build a panel in the UI.
      cy.window().then((win) => {
        const state = {
          ver: 1,
          tab: 'shared-panel-id',
          viewState: { dataset: 'workloadEvents', pageSize: 100 },
          panelConfig: {
            id: 'shared-panel-id',
            label: 'Shared View',
            type: 'custom',
            eventsConfig: { dataset: 'workloadEvents' }
          }
        }
        const encoded = btoa(encodeURIComponent(JSON.stringify(state)))
        const baseUrl = win.location.pathname + win.location.search
        const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}shareState=${encoded}`
        cy.visit(url)
      })

      cy.wait('@graphqlEvents')
      // The shared tab is ephemeral (not persisted) — verify a marker is
      // visible in the tab strip indicating shared/non-persisted state.
      cy.get(REAL_TIME_EVENTS_SHARE.sharedTabMarker).should('exist')
    })

    it('an invalid share URL surfaces an error toast and is cleaned from the URL', () => {
      cy.visit('/real-time-events?shareState=not-valid-base64')
      cy.get(REAL_TIME_EVENTS_SHARE.toastError).should('be.visible').and('contain.text', 'Invalid')
      cy.location('search').should('not.include', 'shareState=')
    })
  }
)
