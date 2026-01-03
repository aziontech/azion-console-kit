/**
 * Edge Functions - Delete Tests (Self-Contained)
 *
 * API: DELETE v4/workspace/functions/{id}
 * Route: /functions
 *
 * Aprendizados:
 * - Testes autocontidos: cada teste cria a função que precisa deletar
 * - Delete confirmation usa o NOME da função, não literal "delete"
 * - Use .p-datatable para detectar tabela
 */

import { tableHelpers } from '../../../support/console-kit-helpers'

const generateFunctionName = (prefix = 'EdgeFunc_DEL') => {
  return `${prefix}_${Date.now()}`
}

const createFunctionForDelete = (name) => {
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

describe('Edge Functions - Delete', { tags: ['@crud', '@edge-functions', '@v4', '@smoke'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Edge Functions')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
  })

  it('should delete function from list', () => {
    // Create function to delete
    const funcName = generateFunctionName('DEL_BASIC')
    createFunctionForDelete(funcName)

    // Edge Functions has single action (delete) - direct button click
    cy.get('[data-testid="data-table-actions-column-body-action-button"]').first().click()

    // Dialog de confirmação - digitar o NOME da função (name.text)
    cy.get('[data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
      .should('be.visible')
      .type(funcName)

    // Confirmar delete
    cy.get('[data-testid="delete-dialog-footer-delete-button"]').click()

    // Verificar sucesso
    cy.get('.p-toast-message-success', { timeout: 15000 })
      .should('be.visible')
      .and('contain', 'deleted')

    // Aguardar lista recarregar
    cy.get('.p-datatable', { timeout: 15000 }).should('exist')

    // Função não deve mais aparecer quando buscar
    cy.get('[data-testid="data-table-search-input"]').clear().type(`${funcName}{enter}`)

    // Deve mostrar empty (função foi deletada)
    cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 15000 })
      .should('exist')
  })

  it('should show confirmation dialog before delete', () => {
    // Create function
    const funcName = generateFunctionName('DEL_DIALOG')
    createFunctionForDelete(funcName)

    // Edge Functions has single action (delete) - direct button click
    cy.get('[data-testid="data-table-actions-column-body-action-button"]').first().click()

    // Dialog should appear with confirmation input
    cy.get('[data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
      .should('be.visible')

    // Cancel button should exist
    cy.get('[data-testid="delete-dialog-footer-cancel-button"]')
      .should('be.visible')
  })

  it('should cancel delete operation', () => {
    // Create function
    const funcName = generateFunctionName('DEL_CANCEL')
    createFunctionForDelete(funcName)

    // Edge Functions has single action (delete) - direct button click
    cy.get('[data-testid="data-table-actions-column-body-action-button"]').first().click()

    // Wait for dialog
    cy.get('[data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
      .should('be.visible')

    // Cancel
    cy.get('[data-testid="delete-dialog-footer-cancel-button"]').click()

    // Dialog should close
    cy.get('[data-testid="delete-dialog-confirmation-input-field"]').should('not.exist')

    // Function should still exist
    tableHelpers.searchAndSubmit(funcName)
    cy.get('[data-testid*="list-table-block__column__name"]')
      .contains(funcName)
      .should('exist')
  })

  it('should require correct name to enable delete button', () => {
    // Create function
    const funcName = generateFunctionName('DEL_CONFIRM')
    createFunctionForDelete(funcName)

    // Edge Functions has single action (delete) - direct button click
    cy.get('[data-testid="data-table-actions-column-body-action-button"]').first().click()

    // Wait for dialog
    cy.get('[data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
      .should('be.visible')

    // Delete button should be disabled initially
    cy.get('[data-testid="delete-dialog-footer-delete-button"]')
      .should('be.disabled')

    // Type wrong text
    cy.get('[data-testid="delete-dialog-confirmation-input-field"]')
      .type('wrong_name')

    // Delete button should still be disabled
    cy.get('[data-testid="delete-dialog-footer-delete-button"]')
      .should('be.disabled')

    // Clear and type correct name
    cy.get('[data-testid="delete-dialog-confirmation-input-field"]')
      .clear()
      .type(funcName)

    // Delete button should be enabled
    cy.get('[data-testid="delete-dialog-footer-delete-button"]')
      .should('not.be.disabled')
  })
})
