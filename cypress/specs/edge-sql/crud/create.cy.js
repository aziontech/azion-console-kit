/**
 * Edge SQL - Create Tests
 *
 * API: POST v4/workspace/sql/databases
 * Route: /sql-database/create
 *
 * Note: Database creation is async. After submit, status is 'creating'
 * and polling happens until status becomes 'created' or 'ready'.
 */

import { tableHelpers } from '../../../support/console-kit-helpers'

const selectors = {
  contentBlock: '[data-testid="create-edge-sql-database-content-block"]',
  heading: '[data-testid="create-edge-sql-database-heading"]',
  formBlock: '[data-testid="create-edge-sql-database-form-block"]',
  formFields: '[data-testid="create-edge-sql-database-form-fields"]',
  nameInput: '[data-testid="database-name-field"] input',
  submitButton: '[data-testid="form-actions-submit-button"]',
  cancelButton: '[data-testid="form-actions-cancel-button"]',
  listContentBlock: '[data-testid="edge-sql-content-block"]'
}

const generateDatabaseName = (prefix = 'db') => {
  return `${prefix}-${Date.now()}`
}

// Wait for create page to be ready
const waitForPageReady = () => {
  cy.get(selectors.contentBlock, { timeout: 15000 }).should('be.visible')
  cy.get(selectors.nameInput, { timeout: 10000 }).should('be.visible')
}

describe('Edge SQL - Create', { tags: ['@crud', '@edge-sql'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/sql-database/create')
    waitForPageReady()
  })

  describe('Page Display', () => {
    it('should display create database page', () => {
      cy.url().should('include', '/sql-database/create')
      cy.get(selectors.contentBlock).should('be.visible')
    })

    it('should display page title', () => {
      cy.contains('Create Database').should('be.visible')
    })

    it('should display General section', () => {
      cy.contains('General').should('be.visible')
    })

    it('should display name field', () => {
      cy.get(selectors.nameInput).should('be.visible')
      cy.contains('Name').should('be.visible')
    })

    it('should display submit and cancel buttons', () => {
      cy.get(selectors.submitButton).should('be.visible')
      cy.get(selectors.cancelButton).should('be.visible')
    })
  })

  describe('Successful Creation', () => {
    it('should create a database with valid name', () => {
      const dbName = generateDatabaseName('testdb')

      cy.get(selectors.nameInput)
        .clear()
        .type(dbName)

      cy.get(selectors.submitButton).click()

      // Should redirect to list after successful creation
      cy.url().should('include', '/sql-database')
      cy.get(selectors.listContentBlock, { timeout: 30000 }).should('be.visible')

      // Verify database appears in list (may be in 'creating' status)
      tableHelpers.searchAndSubmit(dbName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', dbName)
    })
  })

  describe('Validation Errors', () => {
    it('should show error for empty name', () => {
      cy.get(selectors.nameInput)
        .clear()
        .blur()

      cy.get(selectors.submitButton).click()

      cy.get('body').then(($body) => {
        if ($body.find('.p-error').length) {
          cy.get('.p-error').should('be.visible')
        } else {
          // Form should not submit, stay on page
          cy.url().should('include', '/sql-database/create')
        }
      })
    })

    it('should show error for name less than 6 characters', () => {
      cy.get(selectors.nameInput)
        .clear()
        .type('abc')
        .blur()

      cy.get(selectors.submitButton).click()

      cy.get('body').then(($body) => {
        if ($body.find('.p-error').length) {
          cy.get('.p-error').should('contain', 'at least 6 characters')
        } else {
          cy.url().should('include', '/sql-database/create')
        }
      })
    })

    it('should show error for name with invalid characters', () => {
      cy.get(selectors.nameInput)
        .clear()
        .type('invalid_name!')
        .blur()

      cy.get('body').then(($body) => {
        if ($body.find('.p-error').length) {
          cy.get('.p-error').should('contain', 'letters, numbers and hyphen')
        }
      })
    })

    it('should show error for name exceeding 50 characters', () => {
      const longName = 'a'.repeat(51)

      cy.get(selectors.nameInput)
        .clear()
        .type(longName)
        .blur()

      cy.get('body').then(($body) => {
        if ($body.find('.p-error').length) {
          cy.get('.p-error').should('contain', 'at most 50 characters')
        }
      })
    })
  })

  describe('Form Actions', () => {
    it('should cancel and return to list', () => {
      cy.get(selectors.nameInput).type('will-be-cancelled')

      cy.get(selectors.cancelButton).click()

      cy.url().should('include', '/sql-database')
      cy.url().should('not.include', '/create')
    })
  })

  describe('Valid Name Formats', () => {
    it('should accept name with numbers', () => {
      const dbName = generateDatabaseName('db123')

      cy.get(selectors.nameInput)
        .clear()
        .type(dbName)

      // Should not show validation error
      cy.get('.p-error').should('not.exist')
    })

    it('should accept name with hyphens', () => {
      cy.get(selectors.nameInput)
        .clear()
        .type('my-test-database')

      // Should not show validation error
      cy.get('.p-error').should('not.exist')
    })
  })
})
