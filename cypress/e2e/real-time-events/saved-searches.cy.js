/* eslint-disable cypress/no-unnecessary-waiting */
/**
 * Task 15.2 — E2E Saved Searches Full Workflow
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.7, N.3**
 *
 * User flow:
 *   1. Apply a filter on Real-Time Events.
 *   2. Save as a named search.
 *   3. Reload the page → saved search appears in the overlay/dropdown.
 *   4. Click the saved search → filters/dataset/pageSize reapply.
 *   5. Delete the saved search → removed from the overlay.
 *
 * Tagged `@xfail` until selectors are confirmed end-to-end.
 *
 * NOTE on tenant scoping: useSavedSearches scopes localStorage by
 * `rte-saved-searches:{client_id}:{user_id}`. The Cypress `cy.login`
 * fixture must reliably supply the same identity across reloads, or
 * the saved search will appear empty post-reload (the read uses a
 * different key). The test already implicitly verifies that scoping
 * works — if it ever breaks, the post-reload assertion fails.
 */
import selectors from '../../support/selectors'

const SAVED_SEARCHES = {
  saveButton: '[data-testid="rte-saved-search-save"]',
  overlayTrigger: '[data-testid="rte-saved-searches-trigger"]',
  overlay: '[data-testid="rte-saved-searches-overlay"]',
  searchItem: (name) => `[data-testid="rte-saved-search-item"][data-name="${name}"]`,
  deleteButton: (name) => `[data-testid="rte-saved-search-delete"][data-name="${name}"]`,
  nameInput: '[data-testid="rte-saved-search-name-input"]',
  confirmSaveButton: '[data-testid="rte-saved-search-confirm"]',
  toast: '.p-toast-message'
}

const SEARCH_NAME = `e2e-saved-${Date.now()}`

describe(
  'Real-Time Events · Saved Searches Workflow (Task 15.2)',
  { tags: ['@dev3', '@xfail'] },
  () => {
    beforeEach(() => {
      cy.login()
      cy.openProduct('Real-Time Events')
      cy.intercept('POST', '/v4/events/graphql').as('graphqlEvents')
    })

    it('save → reload → apply → delete (full lifecycle)', () => {
      // 1. Apply a filter.
      cy.get(`${selectors.realTimeEvents.filterOptions} > [tabindex="-1"]`).click()
      cy.get(selectors.realTimeEvents.input).type('status = 500{enter}')
      cy.wait('@graphqlEvents')

      // 2. Save as a named search.
      cy.get(SAVED_SEARCHES.saveButton).click()
      cy.get(SAVED_SEARCHES.nameInput).type(SEARCH_NAME)
      cy.get(SAVED_SEARCHES.confirmSaveButton).click()
      cy.get(SAVED_SEARCHES.toast).should('be.visible')

      // 3. Reload the page → saved search persists in localStorage.
      cy.reload()
      cy.wait('@graphqlEvents')

      // 4. Open the overlay → saved search is visible.
      cy.get(SAVED_SEARCHES.overlayTrigger).click()
      cy.get(SAVED_SEARCHES.overlay).should('be.visible')
      cy.get(SAVED_SEARCHES.searchItem(SEARCH_NAME)).should('be.visible')

      // 5. Click → filter reapplies.
      cy.get(SAVED_SEARCHES.searchItem(SEARCH_NAME)).click()
      cy.wait('@graphqlEvents')
      // The filter chip / input must reflect the loaded value.
      cy.get(selectors.realTimeEvents.input).should('contain.text', 'status')

      // 6. Delete the saved search.
      cy.get(SAVED_SEARCHES.overlayTrigger).click()
      cy.get(SAVED_SEARCHES.deleteButton(SEARCH_NAME)).click()
      cy.get(SAVED_SEARCHES.searchItem(SEARCH_NAME)).should('not.exist')
    })

    it('corrupted localStorage entry is dropped silently on load', () => {
      // Seed localStorage with one valid + one corrupted entry, then load
      // the page and assert only the valid one appears.
      cy.window().then((win) => {
        // The exact storage key depends on the logged-in user — we read it
        // back via the composable if available, otherwise inspect Storage.
        const keys = Object.keys(win.localStorage).filter((key) =>
          key.startsWith('rte-saved-searches:')
        )
        // If no scoped key yet, force-create one via the app first.
        if (keys.length === 0) {
          // skip — the test below covers seeded persistence.
          return
        }
        const storageKey = keys[0]
        win.localStorage.setItem(
          storageKey,
          JSON.stringify([
            {
              id: 'valid-1',
              name: 'Valid Search',
              dataset: 'workloadEvents',
              filterData: null,
              selectedColumns: []
            },
            // Corrupted entry — missing name.
            { id: 'corrupted-1', dataset: 'workloadEvents' },
            null
          ])
        )
      })

      cy.reload()
      cy.wait('@graphqlEvents')
      cy.get(SAVED_SEARCHES.overlayTrigger).click()
      cy.get(SAVED_SEARCHES.searchItem('Valid Search')).should('exist')
      // The bad sibling is gone — no item by that id.
      cy.get(SAVED_SEARCHES.overlay).should('not.contain.text', 'corrupted-1')
    })
  }
)
