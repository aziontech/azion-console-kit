/**
 * Edge Storage - Read/List Tests (Self-Contained)
 *
 * API: v4/workspace/storage
 * Route: /object-storage
 *
 * Self-contained: Creates test data in before(), tests against it.
 * No cleanup needed - CI handles it or data can be reused.
 *
 * Note: Edge Storage uses bucket names as IDs.
 * Bucket names must be lowercase with letters, numbers, and hyphens only.
 *
 * Supports fixture recording:
 * - CYPRESS_TEST_MODE=record: Records API responses to fixtures
 * - CYPRESS_TEST_MODE=replay: Uses recorded fixtures
 * - CYPRESS_TEST_MODE=live: Uses real API (default)
 */

import { tableHelpers, fixtureRecorder } from '../../../support/console-kit-helpers'

const selectors = {
  createButton: '[data-testid="create_Bucket_button"]',
  table: '.p-datatable',
  nameColumn: '[data-testid*="list-table-block__column__name"]',
  sizeColumn: '[data-testid*="list-table-block__column__size"]',
  searchInput: '[data-testid="data-table-search-input"]',
  actionsButton: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
  form: {
    nameInput: '[data-testid="bucket-form__name__input"]'
  },
  formActions: {
    saveButton: '[data-testid="form-actions-submit-button"]'
  }
}

// Test data - bucket names must be lowercase with hyphens
const testBucketName = `cy-read-list-${Date.now()}`

// Wait for page to be ready
const waitForPageReady = () => {
  cy.url().should('include', '/object-storage')
  tableHelpers.waitForListReady()
}

// Helper to create a bucket for testing
const createTestBucket = (name) => {
  cy.visit('/object-storage')
  waitForPageReady()

  // Click create button
  cy.get(selectors.createButton).click()

  // Fill name
  cy.get(selectors.form.nameInput, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(name)

  // Submit
  cy.get(selectors.formActions.saveButton).click()
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
}

describe('Edge Storage - Read/List', { tags: ['@crud', '@edge-storage'] }, () => {
  before(() => {
    // Setup: Create test data once for all tests in this spec
    cy.login()
    createTestBucket(testBucketName)
  })

  beforeEach(() => {
    fixtureRecorder.setupSync('edgeStorage', 'v4/workspace/storage')
    cy.login()
    cy.visit('/object-storage')
    waitForPageReady()
  })

  afterEach(() => {
    fixtureRecorder.saveRecordings()
  })

  describe('Page Display', () => {
    it('should display object storage page', () => {
      cy.url().should('include', '/object-storage')
      cy.contains('Object Storage').should('be.visible')
    })

    it('should display create button', () => {
      cy.get(selectors.createButton, { timeout: 15000 }).should('be.visible')
    })
  })

  describe('Table Display', () => {
    it('should display table with columns', () => {
      cy.get('th').contains('Name').should('exist')
      cy.get('th').contains('Size').should('exist')
    })

    it('should display buckets in list', () => {
      cy.get(selectors.nameColumn).should('have.length.at.least', 1)
    })

    it('should display our test bucket', () => {
      tableHelpers.searchAndSubmit(testBucketName)
      cy.get(selectors.nameColumn, { timeout: 10000 })
        .should('contain', testBucketName)
    })
  })

  describe('Search Functionality', () => {
    it('should have search input', () => {
      cy.get(selectors.searchInput).should('be.visible')
    })

    it('should show no results for non-matching search', () => {
      tableHelpers.searchAndSubmit('nonexistent-bucket-xyz999')
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 10000 })
        .should('exist')
    })

    it('should filter buckets by search term', () => {
      tableHelpers.searchAndSubmit(testBucketName)
      cy.get(selectors.nameColumn, { timeout: 10000 })
        .should('contain', testBucketName)
    })
  })

  describe('Row Actions', () => {
    it('should display actions menu button', () => {
      cy.get(selectors.actionsButton).should('exist')
    })

    it('should display edit and delete actions in menu', () => {
      tableHelpers.searchAndSubmit(testBucketName)
      cy.get(selectors.actionsButton).first().click()
      cy.get('[role="menuitem"]').contains(/edit/i).should('exist')
      cy.get('[role="menuitem"]').contains(/delete/i).should('exist')
      cy.get('body').click(0, 0)
    })
  })

  describe('Navigation', () => {
    it('should navigate to create page', () => {
      cy.get(selectors.createButton).click()
      cy.url().should('include', '/object-storage/create')
    })

    it('should navigate to bucket view when clicking row', () => {
      tableHelpers.searchAndSubmit(testBucketName)
      cy.get(selectors.nameColumn).first().click()
      cy.url().should('match', /\/object-storage\/[^/]+$/)
    })
  })

  describe('Bucket View', () => {
    it('should display bucket contents when entering bucket', () => {
      tableHelpers.searchAndSubmit(testBucketName)
      cy.get(selectors.nameColumn).first().click()
      // Should show bucket name in heading
      cy.contains(testBucketName).should('be.visible')
      // Should show file management UI elements
      cy.contains('Add to files').should('be.visible')
    })
  })
})
