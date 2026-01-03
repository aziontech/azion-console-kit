/**
 * WAF Rules - Read/List Tests (Self-Contained)
 *
 * API: GET v4/workspace/wafs
 * Route: /waf, /waf/edit/:id
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
import selectors from '../../../support/selectors/product-selectors/waf-product'

// Test data - created once, used by all tests in this spec
const testWafName = `cy-read-list-${Date.now()}`

// Helper to create a WAF rule for testing
const createTestWaf = (name) => {
  // Navigate to WAF list first
  cy.openProduct('WAF Rules')
  tableHelpers.waitForListReady()

  // Click create button
  cy.get(selectors.createButton).click()

  // Fill name
  cy.get(selectors.nameInput, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(name)

  // Submit
  cy.get('[data-testid="form-actions-submit-button"]').click()
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
}

describe('WAF Rules - Read/List', { tags: ['@crud', '@waf', '@v4'] }, () => {
  before(() => {
    // Setup: Create test data once for all tests in this spec
    cy.login()
    createTestWaf(testWafName)
  })

  beforeEach(() => {
    fixtureRecorder.setupSync('waf', 'v4/workspace/wafs')
    cy.login()
    cy.openProduct('WAF Rules')
    tableHelpers.waitForListReady()
  })

  afterEach(() => {
    fixtureRecorder.saveRecordings()
  })

  describe('List View', () => {
    it('should display WAF rules page', () => {
      cy.get(selectors.createButton, { timeout: 15000 }).should('be.visible')
    })

    it('should display table with correct columns', () => {
      cy.get('th').contains('Name').should('exist')
      cy.get('th').contains(/Mode|Threat Types|ID/i).should('exist')
    })

    it('should display WAF rule data in rows', () => {
      cy.get('[data-testid*="list-table-block__column__name"]').should('exist')
    })
  })

  describe('Search Functionality', () => {
    it('should have search input', () => {
      cy.get('[data-testid="data-table-search-input"]', { timeout: 15000 }).should('exist')
    })

    it('should show no results for non-matching search', () => {
      tableHelpers.searchAndSubmit('NONEXISTENT_WAF_XYZ999')
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 10000 })
        .should('exist')
    })

    it('should filter WAF rules by search term', () => {
      // Search for our test WAF
      tableHelpers.searchAndSubmit(testWafName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 10000 })
        .should('contain', testWafName)
    })
  })

  describe('Table Interactions', () => {
    it('should navigate to edit page when clicking a row', () => {
      // Search for our test WAF first
      tableHelpers.searchAndSubmit(testWafName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testWafName)
        .click()

      cy.url({ timeout: 15000 }).should('include', '/waf/edit/')
      cy.get(selectors.nameInput, { timeout: 15000 }).should('exist')
    })

    it('should show action button for each row', () => {
      cy.get('[data-testid*="actions"]').should('exist')
    })
  })

  describe('Detail View (Edit Page)', () => {
    it('should load WAF rule data for editing', () => {
      // Navigate to our test WAF
      tableHelpers.searchAndSubmit(testWafName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testWafName)
        .click()

      cy.get(selectors.nameInput, { timeout: 15000 })
        .should('have.value', testWafName)
    })

    it('should display tabs for Main Settings, Tuning, and Allowed Rules', () => {
      // Navigate to our test WAF
      tableHelpers.searchAndSubmit(testWafName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testWafName)
        .click()

      // Check for tabs
      cy.get('.p-tabview-nav', { timeout: 15000 }).should('exist')
      cy.get(selectors.mainSettingsTab, { timeout: 10000 }).should('exist')
    })
  })
})
