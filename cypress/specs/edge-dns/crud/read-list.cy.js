/**
 * Edge DNS - Read/List Tests (Self-Contained)
 *
 * API: GET v4/workspace/dns/zones
 * Route: /edge-dns, /edge-dns/edit/:id
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
import selectors from '../../../support/selectors/product-selectors/edge-dns'

// Test data - created once, used by all tests in this spec
const timestamp = Date.now()
const testZoneName = `cy-read-list-${timestamp}`
const testDomain = `cy-test-${timestamp}.com`

// Helper to create a zone for testing
const createTestZone = (name, domain) => {
  // Navigate to Edge DNS list first
  cy.openProduct('Edge DNS')
  cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

  // Click create button
  cy.get(selectors.createButton).click()

  // Fill zone name
  cy.get(selectors.form.nameInput, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(name)

  // Fill domain
  cy.get(selectors.form.domainInput, { timeout: 10000 })
    .should('be.visible')
    .clear()
    .type(domain)

  // Submit
  cy.get(selectors.formActions.saveButton).click()
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
}

describe('Edge DNS - Read/List', { tags: ['@crud', '@edge-dns', '@v4', '@smoke'] }, () => {
  before(() => {
    // Setup: Create test data once for all tests in this spec
    cy.login()
    createTestZone(testZoneName, testDomain)
  })

  beforeEach(() => {
    fixtureRecorder.setupSync('edgeDns', 'v4/workspace/dns/zones')
    cy.login()
    cy.openProduct('Edge DNS')
    tableHelpers.waitForListReady()
  })

  afterEach(() => {
    fixtureRecorder.saveRecordings()
  })

  describe('List View', () => {
    it('should display edge dns page', () => {
      cy.get(selectors.createButton, { timeout: 15000 }).should('be.visible')
    })

    it('should display table with correct columns', () => {
      cy.get('th').contains('Name').should('exist')
      cy.get('th').contains(/Domain|Status|ID/i).should('exist')
    })

    it('should display zone data in rows', () => {
      cy.get('[data-testid*="list-table-block__column__name"]').should('exist')
    })
  })

  describe('Search Functionality', () => {
    it('should have search input', () => {
      cy.get(selectors.searchInput, { timeout: 15000 }).should('exist')
    })

    it('should show no results for non-matching search', () => {
      tableHelpers.searchAndSubmit('NONEXISTENT_ZONE_XYZ999')
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 10000 })
        .should('exist')
    })

    it('should filter zones by search term', () => {
      // Search for our test zone
      tableHelpers.searchAndSubmit(testZoneName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 10000 })
        .should('contain', testZoneName)
    })
  })

  describe('Table Interactions', () => {
    it('should navigate to edit page when clicking a row', () => {
      // Search for our test zone first
      tableHelpers.searchAndSubmit(testZoneName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testZoneName)
        .click()

      cy.url({ timeout: 15000 }).should('include', '/edge-dns/edit/')
      cy.get(selectors.form.nameInput, { timeout: 15000 }).should('exist')
    })

    it('should show action button for each row', () => {
      cy.get('[data-testid*="actions"]').should('exist')
    })
  })

  describe('Detail View (Edit Page)', () => {
    it('should load zone data for editing', () => {
      // Navigate to our test zone
      tableHelpers.searchAndSubmit(testZoneName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testZoneName)
        .click()

      cy.get(selectors.form.nameInput, { timeout: 15000 })
        .should('have.value', testZoneName)
    })

    it('should display tabs for Main Settings and Records', () => {
      // Navigate to our test zone
      tableHelpers.searchAndSubmit(testZoneName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testZoneName)
        .click()

      // Check for tabs
      cy.get('.p-tabview-nav', { timeout: 15000 }).should('exist')
    })
  })
})
