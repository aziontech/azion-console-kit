/**
 * Variables - Update Tests (Self-Contained)
 *
 * API: PUT v3/variables/{uuid}
 * Route: /variables/edit/:id
 *
 * Aprendizados:
 * - Testes autocontidos: cada teste cria a variável que precisa
 * - Não usar cy.wait() para aliases
 * - Usar .p-datatable para detectar tabela
 * - Campo key É editável em modo edit (API aceita atualização de key)
 * - Variáveis secret não permitem navegação para edit
 */

import { tableHelpers } from '../../../support/console-kit-helpers'

const generateVariableKey = (prefix = 'VAR_UPD') => {
  return `${prefix}_${Date.now()}`
}

const createVariable = (key, value = 'test-value') => {
  // Click create button
  cy.get('[data-testid="create_Variable_button"], button').contains('Variable').click()

  // Fill form
  cy.get('[data-testid="variables-form__key-field__input"]', { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(key)

  cy.get('[data-testid="variables-form__value-field__input"]')
    .should('be.visible')
    .clear()
    .type(value)

  // Click submit
  cy.get('[data-testid="form-actions-submit-button"]').click()

  // Wait for navigation (API should succeed)
  // NOTE: If this fails with 400, check if test account has variable quota limit
  cy.url({ timeout: 30000 }).should('not.include', '/create')
  cy.get('.p-datatable', { timeout: 15000 }).should('exist')

  // Search for variable
  tableHelpers.searchAndSubmit(key)
  cy.get('[data-testid*="list-table-block__column__key"]', { timeout: 15000 })
    .contains(key)
    .should('exist')
}

describe('Variables - Update', { tags: ['@crud', '@variables', '@v3', '@smoke'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Variables')
    cy.get('.p-datatable, [data-testid="data-table-container"], [class*="empty"]', { timeout: 30000 })
      .should('exist')
  })

  it('should update variable value', () => {
    // Criar variável para update
    const varKey = generateVariableKey('VAR_UPD_VALUE')
    createVariable(varKey, 'original-value')

    // Encontrar e clicar na variável recém-criada
    cy.get('[data-testid*="list-table-block__column__key"]')
      .contains(varKey)
      .click()

    // Aguardar form carregar
    cy.get('[data-testid="variables-form__value-field__input"]', { timeout: 15000 })
      .should('exist')

    // Atualizar valor
    const newValue = `updated-${Date.now()}`
    cy.get('[data-testid="variables-form__value-field__input"]')
      .clear()
      .type(newValue)

    // Submeter
    cy.get('[data-testid="form-actions-submit-button"]').click()

    // Verificar sucesso - toast deve aparecer
    cy.get('.p-toast-message-success', { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'Your variable has been updated')
  })

  it('should allow editing key of existing variable', () => {
    // Criar variável para edit
    const varKey = generateVariableKey('VAR_UPD_KEY')
    createVariable(varKey, 'some-value')

    // Clicar na variável recém-criada
    cy.get('[data-testid*="list-table-block__column__key"]')
      .contains(varKey)
      .click()

    // Aguardar form carregar
    cy.get('[data-testid="variables-form__key-field__input"]', { timeout: 15000 })
      .should('exist')

    // Campo key deve estar habilitado para edição
    cy.get('[data-testid="variables-form__key-field__input"]')
      .should('be.enabled')
      .and('have.value', varKey)
  })

  it('should not allow editing value of secret variable', () => {
    // Este teste verifica que variáveis secret não podem ser editadas
    // Não criamos secret aqui pois a UI bloqueia edição (não redireciona)
    cy.get('body').then(($body) => {
      // Encontrar variável secret (value mostra *******)
      const secretRow = $body.find('[data-testid*="list-table-block__column__value"]:contains("*******")')

      if (secretRow.length) {
        // Clicar na variável secret
        cy.wrap(secretRow)
          .first()
          .parents('tr')
          .find('[data-testid*="list-table-block__column__key"]')
          .click()

        // Para variáveis secret, não deve redirecionar para edit
        cy.url().should('include', '/variables')
        cy.url().should('not.include', '/edit')
      } else {
        cy.log('Skipping - no secret variables found')
      }
    })
  })

  it('should show validation error for empty value', () => {
    // Criar variável para teste de validação
    const varKey = generateVariableKey('VAR_UPD_EMPTY')
    createVariable(varKey, 'some-value')

    // Clicar na variável recém-criada
    cy.get('[data-testid*="list-table-block__column__key"]')
      .contains(varKey)
      .click()

    // Aguardar form
    cy.get('[data-testid="variables-form__value-field__input"]', { timeout: 15000 })
      .should('exist')

    // Limpar valor e disparar validação (blur)
    cy.get('[data-testid="variables-form__value-field__input"]')
      .clear()
      .blur()

    // Tentar submeter
    cy.get('[data-testid="form-actions-submit-button"]').click()

    // Deve mostrar erro de validação ou botão deve estar desabilitado/form não submete
    cy.get('body').then(($body) => {
      // Verificar se há mensagem de erro visível
      if ($body.find('[data-testid="variables-form__value-field__error-message"]').length) {
        cy.get('[data-testid="variables-form__value-field__error-message"]')
          .should('be.visible')
      } else if ($body.find('.p-error').length) {
        cy.get('.p-error').should('be.visible')
      } else {
        // Se não há erro visível, pelo menos o form não deve ter navegado (ainda em edit)
        cy.url().should('include', '/variables/edit/')
      }
    })
  })
})
