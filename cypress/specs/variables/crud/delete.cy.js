/**
 * Variables - Delete Tests (Self-Contained)
 *
 * API: DELETE v3/variables/{uuid}
 *
 * Aprendizados:
 * - Testes autocontidos: cada teste cria a variável que vai deletar
 * - Não usar cy.wait() para aliases
 * - Usar .p-datatable para detectar tabela
 * - Variables tem 1 action (delete) = singleButton
 * - Texto de confirmação do delete = variável "key" (não "delete")
 */

import { tableHelpers } from '../../../support/console-kit-helpers'

const generateVariableKey = (prefix = 'VAR_DEL') => {
  return `${prefix}_${Date.now()}`
}

const createVariable = (key, value = 'test-value') => {
  // Aguardar página carregar completamente antes de clicar
  cy.get('[data-testid="create_Variable_button"], button', { timeout: 15000 })
    .contains('Variable')
    .should('be.visible')
    .click()

  cy.get('[data-testid="variables-form__key-field__input"]', { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(key)
  cy.get('[data-testid="variables-form__value-field__input"]')
    .clear()
    .type(value)
  cy.get('[data-testid="form-actions-submit-button"]').click()

  // Aguardar navegação para lista
  cy.url({ timeout: 30000 }).should('not.include', '/create')
  cy.get('.p-datatable', { timeout: 15000 }).should('exist')

  // Buscar a variável para garantir que está visível (paginação)
  tableHelpers.searchAndSubmit(key)
  cy.get('[data-testid*="list-table-block__column__key"]', { timeout: 15000 })
    .contains(key)
    .should('exist')
}

describe('Variables - Delete', { tags: ['@crud', '@variables', '@v3', '@smoke'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Variables')
    cy.get('.p-datatable, [data-testid="data-table-container"], [class*="empty"]', { timeout: 30000 })
      .should('exist')
  })

  it('should show delete confirmation dialog', () => {
    // Criar variável para testar o dialog
    const varKey = generateVariableKey('VAR_DEL_DIALOG')
    createVariable(varKey)

    // Encontrar a linha da variável e clicar no botão delete
    cy.get('[data-testid*="list-table-block__column__key"]')
      .contains(varKey)
      .parents('tr')
      .find('[data-testid="data-table-actions-column-body-action-button"]')
      .click()

    // Dialog de confirmação deve aparecer
    cy.get('[data-testid="delete-dialog"]', { timeout: 5000 })
      .should('be.visible')

    // Cancelar para não deletar
    cy.get('[data-testid="delete-dialog-footer-cancel-button"]')
      .click()

    // Dialog deve fechar
    cy.get('[data-testid="delete-dialog"]', { timeout: 5000 })
      .should('not.exist')
  })

  it('should delete variable after confirmation', () => {
    // Criar variável para deletar
    const varKey = generateVariableKey('VAR_DEL_CONFIRM')
    createVariable(varKey)

    // Encontrar a linha da variável e clicar no botão delete
    cy.get('[data-testid*="list-table-block__column__key"]')
      .contains(varKey)
      .parents('tr')
      .find('[data-testid="data-table-actions-column-body-action-button"]')
      .click()

    // Dialog de confirmação deve aparecer
    cy.get('[data-testid="delete-dialog"]', { timeout: 5000 })
      .should('be.visible')

    // Preencher campo de confirmação com o key da variável
    cy.get('[data-testid="delete-dialog-confirmation-input-field"]')
      .type(varKey)

    // Confirmar delete
    cy.get('[data-testid="delete-dialog-footer-delete-button"]')
      .should('not.be.disabled')
      .click()

    // Aguardar dialog fechar
    cy.get('[data-testid="delete-dialog"]', { timeout: 10000 })
      .should('not.exist')

    // Limpar busca e verificar que variável não existe mais
    tableHelpers.searchAndSubmit(varKey)

    // Deve mostrar empty state (variável foi deletada)
    cy.get('[data-testid*="list-table-block__empty"], .p-datatable-emptymessage', { timeout: 10000 })
      .should('exist')
  })

  it('should cancel delete when clicking cancel button', () => {
    // Criar variável para testar cancelamento
    const varKey = generateVariableKey('VAR_DEL_CANCEL')
    createVariable(varKey)

    // Encontrar a linha da variável e clicar no botão delete
    cy.get('[data-testid*="list-table-block__column__key"]')
      .contains(varKey)
      .parents('tr')
      .find('[data-testid="data-table-actions-column-body-action-button"]')
      .click()

    // Dialog deve aparecer
    cy.get('[data-testid="delete-dialog"]', { timeout: 5000 })
      .should('be.visible')

    // Cancelar
    cy.get('[data-testid="delete-dialog-footer-cancel-button"]')
      .click()

    // Dialog deve fechar
    cy.get('[data-testid="delete-dialog"]', { timeout: 5000 })
      .should('not.exist')

    // Variável deve ainda existir
    cy.get('[data-testid*="list-table-block__column__key"]')
      .contains(varKey)
      .should('exist')
  })

  it('should require confirmation text to enable delete button', () => {
    // Criar variável para testar validação de confirmação
    const varKey = generateVariableKey('VAR_DEL_VALIDATE')
    createVariable(varKey)

    // Encontrar a linha da variável e clicar no botão delete
    cy.get('[data-testid*="list-table-block__column__key"]')
      .contains(varKey)
      .parents('tr')
      .find('[data-testid="data-table-actions-column-body-action-button"]')
      .click()

    // Dialog deve aparecer
    cy.get('[data-testid="delete-dialog"]', { timeout: 5000 })
      .should('be.visible')

    // Botão delete deve estar desabilitado inicialmente
    cy.get('[data-testid="delete-dialog-footer-delete-button"]')
      .should('be.disabled')

    // Digitar texto incorreto
    cy.get('[data-testid="delete-dialog-confirmation-input-field"]')
      .type('wrong-text')

    // Botão ainda deve estar desabilitado
    cy.get('[data-testid="delete-dialog-footer-delete-button"]')
      .should('be.disabled')

    // Cancelar
    cy.get('[data-testid="delete-dialog-footer-cancel-button"]')
      .click()
  })
})
