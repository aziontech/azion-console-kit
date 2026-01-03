/**
 * Edge Functions - Update Tests (Self-Contained)
 *
 * API: PATCH v4/workspace/functions/{id}
 * Route: /functions/edit/:id
 *
 * Aprendizados:
 * - Testes autocontidos: cada teste cria a função que precisa
 * - Use .p-datatable para detectar tabela
 * - Toast success para verificar atualização
 */

import { tableHelpers } from '../../../support/console-kit-helpers'

const generateFunctionName = (prefix = 'EdgeFunc_UPD') => {
  return `${prefix}_${Date.now()}`
}

const createFunction = (name) => {
  cy.get('[data-testid="create_Function_button"]', { timeout: 15000 })
    .should('be.visible')
    .click()

  cy.get('[data-testid="field-text__input"]', { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(name)

  cy.get('[data-testid="form-actions-submit-button"]').click()

  // Wait for creation
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

  // Navigate back to list
  cy.openProduct('Edge Functions')
  cy.get('.p-datatable', { timeout: 15000 }).should('exist')

  // Search for the function to ensure it's visible
  tableHelpers.searchAndSubmit(name)
  cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
    .contains(name)
    .should('exist')
}

describe('Edge Functions - Update', { tags: ['@crud', '@edge-functions', '@v4', '@smoke'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Edge Functions')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
  })

  it('should update function name', () => {
    // Create function for update
    const originalName = generateFunctionName('UPD_NAME')
    createFunction(originalName)

    // Click on the function to edit
    cy.get('[data-testid*="list-table-block__column__name"]')
      .contains(originalName)
      .click()

    // Wait for form to load
    cy.get('[data-testid="field-text__input"]', { timeout: 15000 })
      .should('have.value', originalName)

    // Update name
    const newName = `${originalName}_UPDATED`
    cy.get('[data-testid="field-text__input"]')
      .clear()
      .type(newName)

    // Submit
    cy.get('[data-testid="form-actions-submit-button"]').click()

    // Verify success toast
    cy.get('.p-toast-message-success', { timeout: 30000 })
      .should('be.visible')
      .and('contain', 'updated')
  })

  it('should navigate to Code tab and verify editor', () => {
    // Create function for update
    const funcName = generateFunctionName('UPD_CODE')
    createFunction(funcName)

    // Click on the function to edit
    cy.get('[data-testid*="list-table-block__column__name"]')
      .contains(funcName)
      .click()

    // Wait for form to load
    cy.get('[data-testid="field-text__input"]', { timeout: 15000 })
      .should('have.value', funcName)

    // Navigate to Code tab
    cy.get('.p-tabview-nav li').eq(1).click()

    // Monaco editor should be visible
    cy.get('.monaco-editor', { timeout: 15000 }).should('be.visible')
  })

  it('should show validation error for empty name', () => {
    // Create function for validation test
    const funcName = generateFunctionName('UPD_VALID')
    createFunction(funcName)

    // Click on the function to edit
    cy.get('[data-testid*="list-table-block__column__name"]')
      .contains(funcName)
      .click()

    // Wait for form to load
    cy.get('[data-testid="field-text__input"]', { timeout: 15000 })
      .should('exist')

    // Clear name and blur
    cy.get('[data-testid="field-text__input"]')
      .clear()
      .blur()

    // Try to submit
    cy.get('[data-testid="form-actions-submit-button"]').click()

    // Should show error or prevent submission
    cy.get('body').then(($body) => {
      if ($body.find('.p-error, [data-testid*="error"]').length) {
        cy.get('.p-error, [data-testid*="error"]').should('be.visible')
      } else {
        // Form validation prevents submission - should stay on edit page
        cy.url().should('include', '/functions/edit/')
      }
    })
  })

  it('should cancel update and return to list', () => {
    // Create function for cancel test
    const funcName = generateFunctionName('UPD_CANCEL')
    createFunction(funcName)

    // Click on the function to edit
    cy.get('[data-testid*="list-table-block__column__name"]')
      .contains(funcName)
      .click()

    // Wait for form to load
    cy.get('[data-testid="field-text__input"]', { timeout: 15000 })
      .should('have.value', funcName)

    // Modify name
    cy.get('[data-testid="field-text__input"]')
      .type('_MODIFIED')

    // Cancel
    cy.get('[data-testid="form-actions-cancel-button"]').click()

    // Handle potential confirmation dialog
    cy.get('body').then(($body) => {
      if ($body.find('.p-dialog-footer button').length) {
        cy.get('.p-dialog-footer button').contains(/leave|discard|confirm/i).click()
      }
    })

    // Should return to list
    cy.get('.p-datatable', { timeout: 30000 }).should('exist')
  })
})
