/**
 * Teams - Read/List Tests (Self-Contained)
 *
 * API: GET v4/iam/teams
 * Route: /teams-permission, /teams-permission/edit/:id
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

const selectors = {
  createButton: '[data-testid="create_Team_button"]',
  searchInput: '[data-testid="data-table-search-input"]',
  form: {
    nameInput: '[data-testid="teams-permissions-form__name__field-text__input"]'
  },
  formActions: {
    saveButton: '[data-testid="form-actions-submit-button"]'
  }
}

// Test data - created once, used by all tests in this spec
const testTeamName = `cy-read-list-${Date.now()}`

// Helper to create a team for testing
const createTestTeam = (name) => {
  // Navigate to Teams list first
  cy.openProduct('Teams Permissions')
  cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

  // Click create button
  cy.get(selectors.createButton).click()

  // Fill name
  cy.get(selectors.form.nameInput, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(name)

  // Select at least one permission (required field)
  // Wait for permissions list to load
  cy.get('[data-testid="teams-permissions-form__permissions-field__picklist"]', { timeout: 10000 })
    .should('be.visible')

  // Select first item from source list and move to target
  cy.get('[data-testid="teams-permissions-form__permissions-field-picklist__source-list"] .p-picklist-item')
    .first()
    .click()

  // Move to target
  cy.get('[data-testid="teams-permissions-form__permissions-field-picklist__move-to-target-btn"]').click()

  // Submit
  cy.get(selectors.formActions.saveButton).click()
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
}

describe('Teams - Read/List', { tags: ['@crud', '@teams', '@v4'] }, () => {
  before(() => {
    // Setup: Create test data once for all tests in this spec
    cy.login()
    createTestTeam(testTeamName)
  })

  beforeEach(() => {
    fixtureRecorder.setupSync('teams', 'v4/iam/teams')
    cy.login()
    cy.openProduct('Teams Permissions')
    tableHelpers.waitForListReady()
  })

  afterEach(() => {
    fixtureRecorder.saveRecordings()
  })

  describe('List View', () => {
    it('should display teams page', () => {
      cy.get(selectors.createButton, { timeout: 15000 }).should('be.visible')
    })

    it('should display table with correct columns', () => {
      cy.get('th').contains('Name').should('exist')
      cy.get('th').contains(/Permissions|ID/i).should('exist')
    })

    it('should display team data in rows', () => {
      cy.get('[data-testid*="list-table-block__column__name"]').should('exist')
    })
  })

  describe('Search Functionality', () => {
    it('should have search input', () => {
      cy.get(selectors.searchInput, { timeout: 15000 }).should('exist')
    })

    it('should show no results for non-matching search', () => {
      tableHelpers.searchAndSubmit('NONEXISTENT_TEAM_XYZ999')
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 10000 })
        .should('exist')
    })

    it('should filter teams by search term', () => {
      // Search for our test team
      tableHelpers.searchAndSubmit(testTeamName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 10000 })
        .should('contain', testTeamName)
    })
  })

  describe('Table Interactions', () => {
    it('should navigate to edit page when clicking a row', () => {
      // Search for our test team first
      tableHelpers.searchAndSubmit(testTeamName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testTeamName)
        .click()

      cy.url({ timeout: 15000 }).should('include', '/teams-permission/edit/')
      cy.get(selectors.form.nameInput, { timeout: 15000 }).should('exist')
    })

    it('should show action button for each row', () => {
      cy.get('[data-testid*="actions"]').should('exist')
    })
  })

  describe('Detail View (Edit Page)', () => {
    it('should load team data for editing', () => {
      // Navigate to our test team
      tableHelpers.searchAndSubmit(testTeamName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testTeamName)
        .click()

      cy.get(selectors.form.nameInput, { timeout: 15000 })
        .should('have.value', testTeamName)
    })
  })
})
