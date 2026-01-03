/**
 * Variables - Create Tests
 *
 * API: POST v3/variables
 * Route: /variables/create
 *
 * Aprendizados aplicados:
 * - Não usar cy.wait() para aliases
 * - Create button: create_Variable_button
 * - Form fields: variables-form__key-field__input, variables-form__value-field__input
 */

const generateVariableKey = (prefix = 'VAR_TEST') => {
  return `${prefix}_${Date.now()}`
}

describe('Variables - Create', { tags: ['@crud', '@variables', '@v3', '@smoke'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Variables')
    // Aguardar página carregar (tabela ou empty state)
    cy.get('.p-datatable, [data-testid="data-table-container"], [class*="empty"]', { timeout: 30000 })
      .should('exist')
  })

  it('should create a non-secret variable', () => {
    const varKey = generateVariableKey('VAR_NONSECRET')
    const varValue = 'test-value-123'

    // Intercept API
    cy.intercept('POST', '**/v3/variables').as('createVar')

    // Clicar no botão criar (pode estar na tabela ou no empty state)
    cy.get('[data-testid="create_Variable_button"], button').contains('Variable').click()

    // Preencher formulário
    cy.get('[data-testid="variables-form__key-field__input"]', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type(varKey)

    cy.get('[data-testid="variables-form__value-field__input"]')
      .clear()
      .type(varValue)

    // Secret toggle está off por padrão - não precisa fazer nada

    // Submeter formulário
    cy.get('[data-testid="form-actions-submit-button"]').click()

    // Aguardar resposta da API
    cy.wait('@createVar', { timeout: 30000 }).then((interception) => {
      cy.log(`API Status: ${interception.response.statusCode}`)
      if (interception.response.statusCode >= 400) {
        cy.log(`API Error: ${JSON.stringify(interception.response.body)}`)
      }
      expect(interception.response.statusCode).to.eq(201)
    })

    // Verificar sucesso - deve sair da página de create
    cy.url({ timeout: 15000 }).should('not.include', '/create')

    // E deve estar em /variables (lista ou edit)
    cy.url().should('include', '/variables')
  })

  it('should create a secret variable', () => {
    const varKey = generateVariableKey('VAR_SECRET')
    const varValue = 'secret-value-456'

    // Clicar no botão criar
    cy.get('[data-testid="create_Variable_button"], button').contains('Variable').click()

    // Preencher formulário
    cy.get('[data-testid="variables-form__key-field__input"]', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type(varKey)

    cy.get('[data-testid="variables-form__value-field__input"]')
      .clear()
      .type(varValue)

    // Habilitar secret toggle
    cy.get('[data-testid="variables-form__secret-field"]').within(() => {
      cy.get('.p-inputswitch').click()
    })

    // Submeter formulário
    cy.get('[data-testid="form-actions-submit-button"]').click()

    // Verificar sucesso - deve sair da página de create
    cy.url({ timeout: 15000 }).should('not.include', '/create')
    cy.url().should('include', '/variables')
  })

  it('should show validation error for empty key', () => {
    // Clicar no botão criar
    cy.get('[data-testid="create_Variable_button"], button').contains('Variable').click()

    // Deixar key vazio, preencher só value
    cy.get('[data-testid="variables-form__value-field__input"]', { timeout: 10000 })
      .clear()
      .type('some-value')

    // Tentar submeter
    cy.get('[data-testid="form-actions-submit-button"]').click()

    // Deve mostrar erro de validação
    cy.get('[data-testid="variables-form__key-field__error-message"], .p-error', { timeout: 5000 })
      .should('be.visible')
  })

  it('should show validation error for invalid key format', () => {
    // Clicar no botão criar
    cy.get('[data-testid="create_Variable_button"], button').contains('Variable').click()

    // Key com formato inválido (lowercase, espaços)
    cy.get('[data-testid="variables-form__key-field__input"]', { timeout: 10000 })
      .clear()
      .type('invalid key with spaces')

    cy.get('[data-testid="variables-form__value-field__input"]')
      .clear()
      .type('some-value')

    // Tentar submeter
    cy.get('[data-testid="form-actions-submit-button"]').click()

    // Deve mostrar erro de validação
    cy.get('[data-testid="variables-form__key-field__error-message"], .p-error', { timeout: 5000 })
      .should('be.visible')
  })
})
