/**
 * SSO Management - Read/List Tests (Self-Contained)
 *
 * API: v4/iam/identity_providers
 * Route: /identity-providers
 *
 * Self-contained: Creates test OIDC provider in before(), tests against it.
 * No cleanup needed - CI handles it or data can be reused.
 *
 * Note: SSO Management is in the account menu (right side).
 * It requires the `federated_auth` flag to be enabled.
 *
 * Supports fixture recording:
 * - CYPRESS_TEST_MODE=record: Records API responses to fixtures
 * - CYPRESS_TEST_MODE=replay: Uses recorded fixtures
 * - CYPRESS_TEST_MODE=live: Uses real API (default)
 */

import { tableHelpers, fixtureRecorder } from '../../../support/console-kit-helpers'

const selectors = {
  createButton: '[data-testid="create_Identity Provider_button"]',
  table: '.p-datatable',
  nameColumn: '[data-testid*="list-table-block__column__name"]',
  protocolColumn: '[data-testid*="list-table-block__column__protocol"]',
  actionsButton: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
  searchInput: '[data-testid="data-table-search-input"]',
  form: {
    nameInput: '[data-testid="identity-provider-form__name__input"]',
    protocolDropdown: '[data-testid="identity-provider-form__protocol__dropdown"]',
    // OIDC fields
    clientIdInput: '[data-testid="identity-provider-form__client-id__input"]',
    clientSecretInput: '[data-testid="identity-provider-form__client-secret__input"]',
    authorizationUrlInput: '[data-testid="identity-provider-form__authorization-url__input"]',
    tokenUrlInput: '[data-testid="identity-provider-form__token-url__input"]',
    userinfoUrlInput: '[data-testid="identity-provider-form__userinfo-url__input"]',
    redirectUrlInput: '[data-testid="identity-provider-form__redirect-url__input"]'
  },
  formActions: {
    saveButton: '[data-testid="form-actions-submit-button"]'
  }
}

// Test data - created once, used by all tests in this spec
const testProviderName = `cy-read-list-${Date.now()}`

// Helper to create an OIDC identity provider for testing
const createTestIdentityProvider = (name) => {
  cy.visit('/identity-providers')
  tableHelpers.waitForListReady()

  // Click create button (may be in table or empty state)
  cy.get('body').then(($body) => {
    if ($body.find(selectors.createButton).length > 0) {
      cy.get(selectors.createButton).click()
    } else {
      // Empty state create button
      cy.contains('Identity Provider').click()
    }
  })

  // Fill name
  cy.get(selectors.form.nameInput, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(name)

  // OIDC is usually the default protocol
  // Fill required OIDC fields with test values
  cy.get(selectors.form.clientIdInput, { timeout: 10000 })
    .should('be.visible')
    .type('test-client-id')

  cy.get(selectors.form.clientSecretInput)
    .should('be.visible')
    .type('test-client-secret')

  cy.get(selectors.form.authorizationUrlInput)
    .should('be.visible')
    .type('https://example.com/authorize')

  cy.get(selectors.form.tokenUrlInput)
    .should('be.visible')
    .type('https://example.com/token')

  cy.get(selectors.form.userinfoUrlInput)
    .should('be.visible')
    .type('https://example.com/userinfo')

  // Submit
  cy.get(selectors.formActions.saveButton).click()
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
}

describe('SSO Management - Read/List', { tags: ['@crud', '@sso-management', '@account-menu'] }, () => {
  before(() => {
    // Setup: Create test data once for all tests in this spec
    cy.login()
    createTestIdentityProvider(testProviderName)
  })

  beforeEach(() => {
    fixtureRecorder.setupSync('ssoManagement', 'v4/iam/identity_providers')
    cy.login()
    // SSO Management is in the account menu, use cy.visit directly
    cy.visit('/identity-providers')
    tableHelpers.waitForListReady()
  })

  afterEach(() => {
    fixtureRecorder.saveRecordings()
  })

  describe('Page Display', () => {
    it('should display SSO Management page', () => {
      cy.url().should('include', '/identity-providers')
      cy.get(selectors.createButton).should('be.visible')
    })

    it('should display page title', () => {
      cy.contains('SSO Management').should('be.visible')
    })
  })

  describe('Table Display', () => {
    it('should display table with columns', () => {
      cy.get('th').contains('Name').should('exist')
      cy.get('th').contains('Protocol').should('exist')
    })

    it('should display identity providers in list', () => {
      cy.get(selectors.nameColumn).should('have.length.at.least', 1)
    })

    it('should display our test provider', () => {
      tableHelpers.searchAndSubmit(testProviderName)
      cy.get(selectors.nameColumn, { timeout: 10000 })
        .should('contain', testProviderName)
    })
  })

  describe('Search Functionality', () => {
    it('should have search input', () => {
      cy.get(selectors.searchInput).should('be.visible')
    })

    it('should show no results for non-matching search', () => {
      tableHelpers.searchAndSubmit('NONEXISTENT_PROVIDER_XYZ999')
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 10000 })
        .should('exist')
    })

    it('should filter providers by search term', () => {
      tableHelpers.searchAndSubmit(testProviderName)
      cy.get(selectors.nameColumn, { timeout: 10000 })
        .should('contain', testProviderName)
    })
  })

  describe('Row Actions', () => {
    it('should display actions menu for identity providers', () => {
      tableHelpers.searchAndSubmit(testProviderName)
      cy.get(selectors.actionsButton).first().click()
      cy.get('[role="menuitem"]').should('be.visible')
      // Should have "Set as active" action
      cy.get('[role="menuitem"]').contains(/set as active/i).should('exist')
      // Close menu
      cy.get('body').click(0, 0)
    })
  })

  describe('Navigation', () => {
    it('should navigate to create page when clicking create button', () => {
      cy.get(selectors.createButton).click()
      cy.url().should('include', '/identity-providers/create')
    })

    it('should navigate to edit page when clicking a row', () => {
      tableHelpers.searchAndSubmit(testProviderName)
      cy.get(selectors.nameColumn).first().click()
      cy.url({ timeout: 15000 }).should('include', '/identity-providers/edit/')
    })
  })
})
