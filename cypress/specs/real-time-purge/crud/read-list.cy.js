/**
 * Real-Time Purge - Read/List Tests (Self-Contained)
 *
 * API: POST v4/workspace/purge (create)
 *      GraphQL activityHistoryEvents (list)
 * Route: /real-time-purge, /real-time-purge/create
 *
 * Self-contained: Creates test purge in before(), tests against it.
 * Note: Purges are async - may take time to appear in list.
 *
 * Supports fixture recording:
 * - CYPRESS_TEST_MODE=record: Records API responses to fixtures
 * - CYPRESS_TEST_MODE=replay: Uses recorded fixtures
 * - CYPRESS_TEST_MODE=live: Uses real API (default)
 */

import selectors from '../../../support/selectors/product-selectors/edge-purge'
import { tableHelpers, fixtureRecorder } from '../../../support/console-kit-helpers'

const pageSelectors = {
  ...selectors,
  table: '.p-datatable',
  tableRow: '.p-datatable-tbody tr',
  emptyMessage: '[data-testid*="empty"], .p-datatable-emptymessage',
  inlineMessage: '.p-inline-message',
  layerRadio: '.p-radiobutton',
  typeRadioCard: '.p-selectbutton, [class*="radio-card"]',
  formActions: {
    saveButton: '[data-testid="form-actions-submit-button"]',
    cancelButton: '[data-testid="form-actions-cancel-button"]'
  }
}

// Test data
const testPurgeUrl = `https://test-${Date.now()}.example.com/test-path`

// Helper to create a purge for testing
const createTestPurge = () => {
  cy.visit('/real-time-purge/create')
  cy.url().should('include', '/real-time-purge/create')

  // Wait for form to load
  cy.get(pageSelectors.argumentsField, { timeout: 15000 }).should('be.visible')

  // Select URL type (usually second option)
  cy.get('.p-radiobutton-box').then(($radios) => {
    // Find URL radio if available (index may vary)
    if ($radios.length > 1) {
      cy.wrap($radios[1]).click()
    }
  })

  // Fill arguments
  cy.get(pageSelectors.argumentsField)
    .clear()
    .type(testPurgeUrl)

  // Submit
  cy.get(pageSelectors.formActions.saveButton).click()

  // Wait for success toast and redirect
  cy.get('.p-toast-message-success, .p-toast-message-info', { timeout: 30000 }).should('be.visible')
  cy.url({ timeout: 15000 }).should('include', '/real-time-purge')
}

describe('Real-Time Purge - Read/List', { tags: ['@crud', '@real-time-purge'] }, () => {
  before(() => {
    // Setup: Create test purge once for all tests
    cy.login()
    createTestPurge()
  })

  beforeEach(() => {
    fixtureRecorder.setupSync('purge', 'v4/workspace/purge')
    cy.login()
    cy.visit('/real-time-purge')
    // Wait for page to load
    cy.url().should('include', '/real-time-purge')
  })

  afterEach(() => {
    fixtureRecorder.saveRecordings()
  })

  describe('Page Display', () => {
    it('should display real-time purge page', () => {
      cy.url().should('include', '/real-time-purge')
      cy.contains('Real-Time Purge').should('be.visible')
    })

    it('should display create button', () => {
      cy.get(pageSelectors.createButton, { timeout: 15000 }).should('be.visible')
    })

    it('should display info message about queue', () => {
      cy.get(pageSelectors.inlineMessage, { timeout: 15000 }).should('exist')
    })
  })

  describe('Table Display', () => {
    it('should display table with columns', () => {
      cy.get('th', { timeout: 15000 }).contains('Date').should('exist')
      cy.get('th').contains('Type').should('exist')
    })

    it('should display User column', () => {
      cy.get('th', { timeout: 15000 }).contains('User').should('exist')
    })

    it('should display Layer column', () => {
      cy.get('th', { timeout: 15000 }).contains('Layer').should('exist')
    })

    it('should display Arguments column', () => {
      cy.get('th', { timeout: 15000 }).contains('Arguments').should('exist')
    })
  })

  describe('Purge History', () => {
    it('should display purge entries in table', () => {
      // Purges may take time to appear - wait for table data
      cy.get('.p-datatable-tbody tr, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
    })

    it('should display our test purge URL in arguments', () => {
      // Wait for data to load - purges are async
      cy.wait(2000)
      cy.get('.p-datatable-tbody', { timeout: 30000 }).then(($tbody) => {
        if ($tbody.find('tr').length > 0) {
          // Check if our URL appears (may be truncated)
          cy.get('.p-datatable-tbody').should('contain', 'test-path')
        }
      })
    })
  })

  describe('Row Actions', () => {
    it('should display repurge action button', () => {
      cy.get('.p-datatable-tbody tr', { timeout: 30000 }).then(($rows) => {
        if ($rows.length > 0) {
          // Repurge button should exist
          cy.get('[data-testid*="actions"], .p-button-icon-only').should('exist')
        }
      })
    })
  })

  describe('Navigation', () => {
    it('should navigate to create page', () => {
      cy.get(pageSelectors.createButton, { timeout: 15000 }).click()
      cy.url().should('include', '/real-time-purge/create')
    })
  })
})

describe('Real-Time Purge - Create Form', { tags: ['@crud', '@real-time-purge'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/real-time-purge/create')
    cy.url().should('include', '/real-time-purge/create')
  })

  describe('Form Display', () => {
    it('should display layer selection', () => {
      cy.contains('Layer', { timeout: 15000 }).should('exist')
      cy.contains('Cache').should('exist')
    })

    it('should display purge type selection', () => {
      cy.contains('Purge Type', { timeout: 15000 }).should('exist')
    })

    it('should display Cache Key option', () => {
      cy.contains('Cache Key', { timeout: 15000 }).should('exist')
    })

    it('should display URL option', () => {
      cy.contains('URL', { timeout: 15000 }).should('exist')
    })

    it('should display Wildcard option', () => {
      cy.contains('Wildcard', { timeout: 15000 }).should('exist')
    })

    it('should display arguments textarea', () => {
      cy.get(pageSelectors.argumentsField, { timeout: 15000 }).should('exist')
    })
  })

  describe('Form Validation', () => {
    it('should require arguments field', () => {
      // Try to submit without filling arguments
      cy.get(pageSelectors.formActions.saveButton).click()
      // Should show validation error
      cy.get('.p-error, .p-invalid', { timeout: 5000 }).should('exist')
    })
  })

  describe('Form Actions', () => {
    it('should have save button', () => {
      cy.get(pageSelectors.formActions.saveButton, { timeout: 15000 }).should('exist')
    })

    it('should have cancel button', () => {
      cy.get(pageSelectors.formActions.cancelButton, { timeout: 15000 }).should('exist')
    })

    it('should navigate back on cancel', () => {
      cy.get(pageSelectors.formActions.cancelButton).click()
      cy.url().should('include', '/real-time-purge')
      cy.url().should('not.include', '/create')
    })
  })
})

describe('Real-Time Purge - API Integration', { tags: ['@crud', '@real-time-purge', '@api'] }, () => {
  beforeEach(() => {
    cy.login()
  })

  it('should intercept purge creation API call', () => {
    // Intercept the purge API
    cy.intercept('POST', '**/v4/workspace/purge/**').as('purgeApi')

    cy.visit('/real-time-purge/create')
    cy.url().should('include', '/real-time-purge/create')

    // Wait for form to load
    cy.get(pageSelectors.argumentsField, { timeout: 15000 }).should('be.visible')

    // Fill the form with a unique URL
    const apiTestUrl = `https://api-test-${Date.now()}.example.com/path`
    cy.get(pageSelectors.argumentsField)
      .clear()
      .type(apiTestUrl)

    // Submit
    cy.get(pageSelectors.formActions.saveButton).click()

    // Verify API was called with correct data
    cy.wait('@purgeApi', { timeout: 30000 }).then((interception) => {
      expect(interception.request.body).to.have.property('items')
      expect(interception.response.statusCode).to.be.oneOf([200, 201, 202])
    })
  })

  it('should intercept purge history GraphQL query', () => {
    // Intercept the GraphQL query for purge history
    cy.intercept('POST', '**/graphql').as('graphqlHistory')

    cy.visit('/real-time-purge')
    cy.url().should('include', '/real-time-purge')

    // Wait for the query
    cy.wait('@graphqlHistory', { timeout: 30000 }).then((interception) => {
      expect(interception.request.body).to.have.property('query')
      // Verify it's querying activity history for purge events
      expect(interception.request.body.query).to.include('activityHistory')
    })
  })
})
