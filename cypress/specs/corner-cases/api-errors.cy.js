/**
 * Corner Cases - API Error Handling Tests
 *
 * Tests how the application handles various API error responses:
 * - 400 Bad Request
 * - 401 Unauthorized
 * - 403 Forbidden
 * - 404 Not Found
 * - 500 Internal Server Error
 * - Network timeouts
 * - Malformed responses
 */

import { tableHelpers } from '../../support/console-kit-helpers'

describe('API Error Handling - Corner Cases', { tags: ['@corner-cases', '@errors'] }, () => {
  beforeEach(() => {
    cy.login()
  })

  describe('List Endpoint Errors', () => {
    it('should handle 500 error on list load', () => {
      // Mock 500 error
      cy.intercept('GET', '**/v4/workspace/functions*', {
        statusCode: 500,
        body: { error: 'Internal Server Error' }
      }).as('listError')

      cy.openProduct('Edge Functions')

      // Should show error state or toast
      cy.wait('@listError')
      cy.get('.p-toast-message-error, [data-testid*="error"], [class*="error"]', {
        timeout: 10000
      }).should('exist')
    })

    it('should handle 403 forbidden error', () => {
      cy.intercept('GET', '**/v4/workspace/functions*', {
        statusCode: 403,
        body: { error: 'Forbidden', message: 'You do not have permission to access this resource' }
      }).as('forbiddenError')

      cy.openProduct('Edge Functions')
      cy.wait('@forbiddenError')

      // Should show permission error
      cy.get('body').then(($body) => {
        const hasError =
          $body.find('.p-toast-message-error').length > 0 ||
          $body.text().includes('permission') ||
          $body.text().includes('Forbidden')
        expect(hasError).to.be.true
      })
    })

    it('should handle empty list response gracefully', () => {
      cy.intercept('GET', '**/v4/workspace/functions*', {
        statusCode: 200,
        body: { results: [], count: 0 }
      }).as('emptyList')

      cy.openProduct('Edge Functions')
      cy.wait('@emptyList')

      // Should show empty state
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage, [class*="empty"]', {
        timeout: 10000
      }).should('exist')
    })
  })

  describe('Create Endpoint Errors', () => {
    beforeEach(() => {
      cy.openProduct('Edge Functions')
      tableHelpers.waitForListReady()
      cy.get('[data-testid="create_Function_button"]').click()
      cy.get('[data-testid="field-text__input"]', { timeout: 15000 }).should('be.visible')
    })

    it('should handle 400 validation error', () => {
      cy.intercept('POST', '**/v4/workspace/functions', {
        statusCode: 400,
        body: { error: 'Bad Request', message: 'Name already exists' }
      }).as('createError')

      cy.get('[data-testid="field-text__input"]').type('duplicate-name')
      cy.get('[data-testid="form-actions-submit-button"]').click()

      cy.wait('@createError')

      // Should show validation error toast
      cy.get('.p-toast-message-error', { timeout: 10000 }).should('be.visible')
    })

    it('should handle 500 error on create', () => {
      cy.intercept('POST', '**/v4/workspace/functions', {
        statusCode: 500,
        body: { error: 'Internal Server Error' }
      }).as('serverError')

      cy.get('[data-testid="field-text__input"]').type(`test-${Date.now()}`)
      cy.get('[data-testid="form-actions-submit-button"]').click()

      cy.wait('@serverError')
      cy.get('.p-toast-message-error', { timeout: 10000 }).should('be.visible')
    })

    it('should handle network timeout', () => {
      cy.intercept('POST', '**/v4/workspace/functions', {
        forceNetworkError: true
      }).as('networkError')

      cy.get('[data-testid="field-text__input"]').type(`test-${Date.now()}`)
      cy.get('[data-testid="form-actions-submit-button"]').click()

      // Should show network error
      cy.get('.p-toast-message-error, [data-testid*="error"]', { timeout: 15000 }).should('exist')
    })
  })

  describe('Update Endpoint Errors', () => {
    it('should handle 404 when resource was deleted', () => {
      // First load the list normally
      cy.intercept('GET', '**/v4/workspace/functions*', {
        statusCode: 200,
        body: {
          results: [{ id: 999, name: 'deleted-function', active: true }],
          count: 1
        }
      }).as('listFunctions')

      // Mock 404 on update
      cy.intercept('PATCH', '**/v4/workspace/functions/999', {
        statusCode: 404,
        body: { error: 'Not Found', message: 'Resource not found' }
      }).as('updateError')

      cy.openProduct('Edge Functions')
      cy.wait('@listFunctions')

      // Click the mocked function
      cy.get('[data-testid*="list-table-block__column__name"]').first().click()

      // Try to update
      cy.get('[data-testid="field-text__input"]', { timeout: 15000 })
        .clear()
        .type('updated-name')
      cy.get('[data-testid="form-actions-submit-button"]').click()

      cy.wait('@updateError')
      cy.get('.p-toast-message-error', { timeout: 10000 }).should('be.visible')
    })

    it('should handle concurrent modification (409 conflict)', () => {
      cy.intercept('PATCH', '**/v4/workspace/functions/*', {
        statusCode: 409,
        body: { error: 'Conflict', message: 'Resource was modified by another user' }
      }).as('conflictError')

      cy.openProduct('Edge Functions')
      tableHelpers.waitForListReady()

      // If there are functions, try to edit one
      cy.get('.p-datatable').then(($table) => {
        if ($table.find('tr[data-pc-section="bodyrow"]').length > 0) {
          cy.get('[data-testid*="list-table-block__column__name"]').first().click()

          cy.get('[data-testid="field-text__input"]', { timeout: 15000 })
            .clear()
            .type('conflict-test')
          cy.get('[data-testid="form-actions-submit-button"]').click()

          cy.wait('@conflictError')
          cy.get('.p-toast-message-error', { timeout: 10000 }).should('be.visible')
        }
      })
    })
  })

  describe('Delete Endpoint Errors', () => {
    it('should handle delete failure gracefully', () => {
      cy.intercept('DELETE', '**/v4/workspace/functions/*', {
        statusCode: 500,
        body: { error: 'Cannot delete resource in use' }
      }).as('deleteError')

      cy.openProduct('Edge Functions')
      tableHelpers.waitForListReady()

      cy.get('.p-datatable').then(($table) => {
        if ($table.find('tr[data-pc-section="bodyrow"]').length > 0) {
          // Open actions menu
          cy.get('[data-testid="data-table-actions-column-body-actions-menu-button"]')
            .first()
            .click()
          cy.get('[role="menuitem"]').contains(/delete/i).click()

          // Confirm delete
          cy.get('.p-dialog', { timeout: 10000 }).should('be.visible')
          cy.get('.p-dialog input').type('any-name')
          cy.get('.p-dialog button').contains(/delete|confirm/i).click()

          cy.wait('@deleteError')
          cy.get('.p-toast-message-error', { timeout: 10000 }).should('be.visible')
        }
      })
    })
  })

  describe('Session Errors', () => {
    it('should redirect to login on 401', () => {
      cy.intercept('GET', '**/v4/workspace/functions*', {
        statusCode: 401,
        body: { error: 'Unauthorized' }
      }).as('authError')

      cy.openProduct('Edge Functions')
      cy.wait('@authError')

      // Should redirect to login or show auth error
      cy.url({ timeout: 10000 }).should('satisfy', (url) => {
        return url.includes('/login') || url.includes('/sso')
      })
    })
  })
})
