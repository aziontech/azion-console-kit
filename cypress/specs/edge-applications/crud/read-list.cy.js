/**
 * Edge Applications - Read/List Tests (Self-Contained)
 *
 * API: GET v4/workspace/applications
 * Route: /edge-application, /edge-application/edit/:id
 *
 * Self-contained: Creates test data in before(), tests against it.
 * No cleanup needed - CI handles it or data can be reused.
 *
 * Supports fixture recording:
 * - CYPRESS_TEST_MODE=record: Records API responses to fixtures
 * - CYPRESS_TEST_MODE=replay: Uses recorded fixtures
 * - CYPRESS_TEST_MODE=live: Uses real API (default)
 */

import { tableHelpers, fixtureRecorder } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/edge-application'

// Test data - created once, used by all tests in this spec
const testAppName = `cy-read-list-${Date.now()}`

// Helper to create an application for testing
const createTestApplication = (name) => {
  // Navigate to Edge Application list first
  cy.openProduct('Edge Application')
  cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

  // Click create button
  cy.get(selectors.mainSettings.createButton).click()

  // Fill name
  cy.get(selectors.mainSettings.nameInput, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(name)

  // If v4 form with address field, fill it
  cy.get('body').then(($body) => {
    if ($body.find(selectors.mainSettings.addressInput).length) {
      cy.get(selectors.mainSettings.addressInput).clear().type('httpbin.org')
    }
  })

  // Submit
  cy.get(selectors.formActions.saveButton).click()
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
}

describe('Edge Applications - Read/List', { tags: ['@crud', '@edge-applications', '@v4', '@smoke'] }, () => {
  before(() => {
    // Setup: Create test data once for all tests in this spec
    cy.login()
    createTestApplication(testAppName)
  })

  beforeEach(() => {
    // Setup fixture recording/replay for v4/workspace/applications API
    fixtureRecorder.setupSync('edgeApplications', 'v4/workspace/applications')

    cy.login()
    cy.openProduct('Edge Application')
    tableHelpers.waitForListReady()
  })

  afterEach(() => {
    // Save recorded fixtures (only runs in record mode)
    fixtureRecorder.saveRecordings()
  })

  describe('List View', () => {
    it('should display edge applications page', () => {
      cy.get(selectors.mainSettings.createButton, { timeout: 15000 }).should('be.visible')
    })

    it('should display table with correct columns', () => {
      cy.get('th').contains('Name').should('exist')
      cy.get('th').contains(/Status|ID/i).should('exist')
    })

    it('should display application data in rows', () => {
      cy.get('[data-testid*="list-table-block__column__name"]').should('exist')
    })
  })

  describe('Search Functionality', () => {
    it('should have search input', () => {
      cy.get(selectors.searchInput, { timeout: 15000 }).should('exist')
    })

    it('should show no results for non-matching search', () => {
      tableHelpers.searchAndSubmit('NONEXISTENT_APP_XYZ999')
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 10000 })
        .should('exist')
    })

    it('should filter applications by search term', () => {
      // Search for our test application
      tableHelpers.searchAndSubmit(testAppName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 10000 })
        .should('contain', testAppName)
    })
  })

  describe('Table Interactions', () => {
    it('should navigate to edit page when clicking a row', () => {
      // Search for our test application first
      tableHelpers.searchAndSubmit(testAppName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testAppName)
        .click()

      cy.url({ timeout: 15000 }).should('include', '/applications/edit/')
      cy.get(selectors.mainSettings.nameInput, { timeout: 15000 }).should('exist')
    })

    it('should show action button for each row', () => {
      cy.get('[data-testid*="actions"]').should('exist')
    })
  })

  describe('Detail View (Edit Page)', () => {
    it('should load application data for editing', () => {
      // Navigate to our test application
      tableHelpers.searchAndSubmit(testAppName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testAppName)
        .click()

      cy.get(selectors.mainSettings.nameInput, { timeout: 15000 })
        .should('have.value', testAppName)
    })

    it('should display tabs for application configuration', () => {
      // Navigate to our test application
      tableHelpers.searchAndSubmit(testAppName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testAppName)
        .click()

      // Check for tabs
      cy.get('.p-tabview-nav', { timeout: 15000 }).should('exist')
    })
  })
})
