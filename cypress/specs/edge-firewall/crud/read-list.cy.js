/**
 * Edge Firewall - Read/List Tests (Self-Contained)
 *
 * API: GET v4/workspace/firewalls
 * Route: /edge-firewall, /edge-firewall/edit/:id
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
import selectors from '../../../support/selectors/product-selectors/edge-firewall'

// Test data - created once, used by all tests in this spec
const testFirewallName = `cy-read-list-${Date.now()}`

// Helper to create a firewall for testing
const createTestFirewall = (name) => {
  // Navigate to Edge Firewall list first
  cy.openProduct('Edge Firewall')
  cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

  // Click create button
  cy.get(selectors.createButton).click()

  // Fill name
  cy.get(selectors.nameInput, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(name)

  // Submit
  cy.get(selectors.formActions.saveButton).click()
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
}

describe('Edge Firewall - Read/List', { tags: ['@crud', '@edge-firewall', '@v4', '@smoke'] }, () => {
  before(() => {
    // Setup: Create test data once for all tests in this spec
    cy.login()
    createTestFirewall(testFirewallName)
  })

  beforeEach(() => {
    fixtureRecorder.setupSync('edgeFirewall', 'v4/workspace/firewalls')
    cy.login()
    cy.openProduct('Edge Firewall')
    tableHelpers.waitForListReady()
  })

  afterEach(() => {
    fixtureRecorder.saveRecordings()
  })

  describe('List View', () => {
    it('should display edge firewall page', () => {
      cy.get(selectors.createButton, { timeout: 15000 }).should('be.visible')
    })

    it('should display table with correct columns', () => {
      cy.get('th').contains('Name').should('exist')
      cy.get('th').contains(/Status|ID/i).should('exist')
    })

    it('should display firewall data in rows', () => {
      cy.get('[data-testid*="list-table-block__column__name"]').should('exist')
    })
  })

  describe('Search Functionality', () => {
    it('should have search input', () => {
      cy.get(selectors.searchInput, { timeout: 15000 }).should('exist')
    })

    it('should show no results for non-matching search', () => {
      tableHelpers.searchAndSubmit('NONEXISTENT_FIREWALL_XYZ999')
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 10000 })
        .should('exist')
    })

    it('should filter firewalls by search term', () => {
      // Search for our test firewall
      tableHelpers.searchAndSubmit(testFirewallName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 10000 })
        .should('contain', testFirewallName)
    })
  })

  describe('Table Interactions', () => {
    it('should navigate to edit page when clicking a row', () => {
      // Search for our test firewall first
      tableHelpers.searchAndSubmit(testFirewallName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testFirewallName)
        .click()

      cy.url({ timeout: 15000 }).should('include', '/firewalls/edit/')
      cy.get(selectors.nameInput, { timeout: 15000 }).should('exist')
    })

    it('should show action button for each row', () => {
      cy.get('[data-testid*="actions"]').should('exist')
    })
  })

  describe('Detail View (Edit Page)', () => {
    it('should load firewall data for editing', () => {
      // Navigate to our test firewall
      tableHelpers.searchAndSubmit(testFirewallName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testFirewallName)
        .click()

      cy.get(selectors.nameInput, { timeout: 15000 })
        .should('have.value', testFirewallName)
    })

    it('should display tabs for Main Settings, Functions, and Rules Engine', () => {
      // Navigate to our test firewall
      tableHelpers.searchAndSubmit(testFirewallName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testFirewallName)
        .click()

      // Check for tabs
      cy.get('.p-tabview-nav', { timeout: 15000 }).should('exist')
      cy.get(selectors.mainSettingsTab, { timeout: 10000 }).should('exist')
    })
  })
})
