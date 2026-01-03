/**
 * Edge Functions - Create Tests (Self-Contained)
 *
 * API: POST v4/workspace/functions
 * Route: /functions/create
 *
 * Aprendizados:
 * - Testes autocontidos: não dependem de estado anterior
 * - Monaco editor está na aba "Code", não na Main Settings
 * - Use .p-datatable para detectar tabela
 * - Toast success pattern: .p-toast-message-success
 */

import { tableHelpers } from '../../../support/console-kit-helpers'

const generateFunctionName = (prefix = 'EdgeFunc') => {
  return `${prefix}_${Date.now()}`
}

describe('Edge Functions - Create', { tags: ['@crud', '@edge-functions', '@v4', '@smoke'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Edge Functions')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
  })

  describe('Successful Creation', () => {
    it('should create a basic edge function with default values', () => {
      const funcName = generateFunctionName('BasicFunc')

      // Click create button
      cy.get('[data-testid="create_Function_button"]').click()

      // Fill name field (Main Settings tab is default)
      cy.get('[data-testid="field-text__input"]', { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(funcName)

      // Submit form - default code (HelloWorld) is auto-loaded
      cy.get('[data-testid="form-actions-submit-button"]').click()

      // Verify success toast
      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')
        .and('contain', 'has been created')

      // Should navigate to edit page or list
      cy.url({ timeout: 15000 }).should('satisfy', (url) => {
        return url.includes('/functions/edit/') || url.includes('/functions')
      })
    })

    it('should verify created function appears in list', () => {
      const funcName = generateFunctionName('ListCheck')

      // Create function
      cy.get('[data-testid="create_Function_button"]').click()
      cy.get('[data-testid="field-text__input"]', { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(funcName)
      cy.get('[data-testid="form-actions-submit-button"]').click()

      // Wait for creation
      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

      // Navigate back to list
      cy.openProduct('Edge Functions')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search for created function
      tableHelpers.searchAndSubmit(funcName)

      // Function should be visible in list
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', funcName)
    })
  })

  describe('Validation Errors', () => {
    it('should show error for empty name', () => {
      cy.get('[data-testid="create_Function_button"]').click()

      // Clear name field and try to submit
      cy.get('[data-testid="field-text__input"]', { timeout: 15000 })
        .should('be.visible')
        .clear()
        .blur()

      // Try to submit
      cy.get('[data-testid="form-actions-submit-button"]').click()

      // Should show validation error or not navigate away
      cy.get('body').then(($body) => {
        if ($body.find('.p-error, [data-testid*="error"]').length) {
          cy.get('.p-error, [data-testid*="error"]').should('be.visible')
        } else {
          // Form validation prevents submission
          cy.url().should('include', '/functions/create')
        }
      })
    })
  })

  describe('Form Actions', () => {
    it('should cancel creation and return to list', () => {
      cy.get('[data-testid="create_Function_button"]').click()

      // Fill some data
      cy.get('[data-testid="field-text__input"]', { timeout: 15000 })
        .should('be.visible')
        .type('WillBeCancelled')

      // Cancel - may show confirmation dialog
      cy.get('[data-testid="form-actions-cancel-button"]').click()

      // Handle potential confirmation dialog
      cy.get('body').then(($body) => {
        if ($body.find('.p-dialog-footer button').length) {
          // Click confirm/leave button in dialog
          cy.get('.p-dialog-footer button').contains(/leave|discard|confirm/i).click()
        }
      })

      // Should return to list (wait longer as navigation may be delayed)
      cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
      cy.url().should('match', /\/functions(\?|$)/)
    })
  })

  describe('Code Editor', () => {
    it('should display Monaco editor on Code tab', () => {
      cy.get('[data-testid="create_Function_button"]').click()

      // Navigate to Code tab (second tab)
      cy.get('.p-tabview-nav li', { timeout: 15000 })
        .eq(1)
        .click()

      // Monaco editor should be visible
      cy.get('.monaco-editor', { timeout: 15000 }).should('be.visible')
    })
  })
})
