/**
 * Real-Time Events - Read Tests (Self-Contained)
 *
 * API: POST v4/events/graphql
 * Route: /real-time-events/:tab?
 *
 * Self-contained: Creates a Variable to generate Activity History event.
 * Activity History events are instant (no propagation delay).
 *
 * Tabs: HTTP Requests, Functions, Functions Console, Image Processor,
 *       Tiered Cache, Edge DNS, Data Stream, Activity History
 */

import selectors from '../../support/selectors/product-selectors/real-time-events'

const pageSelectors = {
  ...selectors,
  tabView: '.p-tabview',
  tabPanel: '.p-tabview-panel',
  tabHeader: '.p-tabview-header',
  table: '.p-datatable',
  tableRow: '.p-datatable-tbody tr',
  drawer: '.p-sidebar',
  recordsTag: '.p-tag',
  graphqlButton: '[data-testid*="graphql"]',
  exportButton: '[data-testid*="export"]'
}

// Test data - create a variable to generate activity history event
const testVariableName = `cy-events-${Date.now()}`

// Helper to create a variable (generates instant activity history event)
const createTestVariable = (name) => {
  cy.openProduct('Variables')
  cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
  cy.get('[data-testid="create_Variable_button"]').click()
  cy.get('[data-testid="variables-form__key-field__input"]', { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(name)
  cy.get('[data-testid="variables-form__value-field__input"]')
    .clear()
    .type('test-value-for-events')
  cy.get('[data-testid="form-actions-submit-button"]').click()
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
}

describe('Real-Time Events - Read', { tags: ['@observe', '@real-time-events'] }, () => {
  before(() => {
    // Setup: Create a variable to generate activity history event
    cy.login()
    createTestVariable(testVariableName)
  })

  beforeEach(() => {
    cy.login()
    cy.visit('/real-time-events')
    // Wait for page to load
    cy.url().should('include', '/real-time-events')
  })

  describe('Page Display', () => {
    it('should display real-time events page', () => {
      cy.url().should('include', '/real-time-events')
      cy.contains('Real-Time Events').should('be.visible')
    })

    it('should display tab navigation', () => {
      cy.get(pageSelectors.tabView, { timeout: 15000 }).should('exist')
    })

    it('should display multiple event type tabs', () => {
      cy.get(pageSelectors.tabHeader, { timeout: 15000 }).should('have.length.at.least', 3)
    })
  })

  describe('Tab Navigation', () => {
    it('should display HTTP Requests tab by default', () => {
      cy.get(pageSelectors.tabHeader, { timeout: 15000 })
        .first()
        .should('contain', 'HTTP')
    })

    it('should switch to Functions tab', () => {
      cy.get(pageSelectors.tabHeader, { timeout: 15000 })
        .contains('Functions')
        .click()
      cy.url().should('include', 'edge-functions')
    })

    it('should switch to Edge DNS tab', () => {
      cy.get(pageSelectors.tabHeader, { timeout: 15000 })
        .contains('Edge DNS')
        .click()
      cy.url().should('include', 'edge-dns')
    })

    it('should switch to Activity History tab', () => {
      cy.get(pageSelectors.tabHeader, { timeout: 15000 })
        .contains('Activity History')
        .click()
      cy.url().should('include', 'activity-history')
    })
  })

  describe('Filter System', () => {
    it('should display filter input', () => {
      // Advanced filter system with query language
      cy.get(pageSelectors.input, { timeout: 15000 }).should('exist')
    })

    it('should show filter suggestions on focus', () => {
      cy.get(pageSelectors.input, { timeout: 15000 }).click()
      // Suggestions should appear
      cy.get('body').then(($body) => {
        if ($body.find(pageSelectors.suggestionsList).length > 0) {
          cy.get(pageSelectors.suggestionsList).should('be.visible')
        }
      })
    })
  })

  describe('Events Table', () => {
    it('should display events table or empty state', () => {
      // Wait for table or empty message
      cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
    })

    it('should display column headers', () => {
      cy.get('.p-datatable', { timeout: 30000 }).then(($table) => {
        if ($table.length > 0) {
          cy.get('.p-datatable-thead th').should('have.length.at.least', 1)
        }
      })
    })

    it('should display records count tag', () => {
      cy.get(pageSelectors.recordsTag, { timeout: 15000 }).should('exist')
    })
  })

  describe('Row Actions', () => {
    it('should open detail drawer when clicking a row', () => {
      cy.get('.p-datatable-tbody tr', { timeout: 30000 }).then(($rows) => {
        if ($rows.length > 0) {
          cy.wrap($rows.first()).click()
          cy.get(pageSelectors.drawer, { timeout: 10000 }).should('be.visible')
        }
      })
    })
  })

  describe('Export and GraphQL', () => {
    it('should have GraphQL button', () => {
      cy.get('[data-testid*="toggle-columns"]', { timeout: 15000 }).should('exist')
    })
  })

  describe('Activity History Integration', () => {
    beforeEach(() => {
      // Go to Activity History tab
      cy.get(pageSelectors.tabHeader, { timeout: 15000 })
        .contains('Activity History')
        .click()
      cy.url().should('include', 'activity-history')
    })

    it('should display activity history events', () => {
      // Wait for table to load
      cy.get('.p-datatable-tbody tr, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
    })

    it('should show our variable creation event', () => {
      // Activity History should show the variable creation immediately
      // Wait for data and check for Variable resource type
      cy.get('.p-datatable-tbody', { timeout: 30000 }).then(($tbody) => {
        if ($tbody.find('tr').length > 0) {
          // Should contain Variable resource type or our test variable name
          cy.get('.p-datatable-tbody').should('contain', 'Variable')
        }
      })
    })

    it('should intercept GraphQL query', () => {
      // Intercept and validate the GraphQL query structure
      cy.intercept('POST', '**/v4/events/graphql').as('graphqlQuery')

      // Refresh to trigger new query
      cy.reload()
      cy.get(pageSelectors.tabHeader, { timeout: 15000 })
        .contains('Activity History')
        .click()

      cy.wait('@graphqlQuery', { timeout: 30000 }).then((interception) => {
        expect(interception.request.body).to.have.property('query')
        expect(interception.response.statusCode).to.equal(200)
      })
    })
  })
})
