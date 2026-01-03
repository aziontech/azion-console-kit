/**
 * Variables - Read/List Functional Tests
 *
 * Este teste suporta 3 modos:
 * - LIVE: Executa contra API real (padrão)
 * - RECORD: Executa contra API real e grava fixtures
 * - REPLAY: Usa fixtures gravadas (functional test)
 *
 * Para gravar fixtures:
 *   CYPRESS_TEST_MODE=record npx cypress run --spec "cypress/specs/variables/functional/*.cy.js"
 *
 * Para rodar testes funcionais (com fixtures):
 *   CYPRESS_TEST_MODE=replay npx cypress run --spec "cypress/specs/variables/functional/*.cy.js"
 */

import { fixtureRecorder, tableHelpers } from '../../../support/console-kit-helpers'

const VARIABLES_API = {
  baseUrl: 'v3/variables',
  moduleName: 'variables'
}

describe('Variables - Read/List (Functional)', { tags: ['@functional', '@variables', '@v3'] }, () => {
  beforeEach(() => {
    // Setup intercepts ANTES do login (importante!)
    const mode = fixtureRecorder.getMode()

    if (mode === 'replay') {
      // Modo REPLAY: usa fixtures gravadas
      fixtureRecorder.setupReplay(VARIABLES_API.moduleName, VARIABLES_API.baseUrl)
    } else {
      // Modo RECORD ou LIVE: usa API real
      fixtureRecorder.setupSync(VARIABLES_API.moduleName, VARIABLES_API.baseUrl)
    }

    cy.login()
    // Wait for page to be fully loaded after login
    cy.get('[data-testid="sidebar-block__toggle-button"]', { timeout: 30000 }).should('exist')
    cy.openProduct('Variables')
    cy.get('.p-datatable, [data-testid="data-table-container"], [class*="empty"]', { timeout: 30000 })
      .should('exist')
  })

  afterEach(() => {
    // Salvar recordings após cada teste (só executa em modo record)
    fixtureRecorder.saveRecordings()
  })

  describe('List View', () => {
    it('should display variables list page', () => {
      // Create button deve estar visível
      cy.get('[data-testid="create_Variable_button"]').should('be.visible')

      // Tabela ou empty state deve estar presente
      cy.get('.p-datatable, [data-testid*="empty"]').should('exist')
    })

    it('should display table with correct columns when data exists', () => {
      cy.get('body').then(($body) => {
        if (!$body.find('[data-testid*="list-table-block__empty"]').length) {
          // Verificar colunas: Key, Value
          cy.get('th').contains('Key').should('exist')
          cy.get('th').contains('Value').should('exist')
        } else {
          cy.log('ℹ️ Empty list - skipping column check')
        }
      })
    })

    it('should display variable data in rows when data exists', () => {
      cy.get('body').then(($body) => {
        if (!$body.find('[data-testid*="list-table-block__empty"]').length) {
          // Coluna key deve ter dados
          cy.get('[data-testid*="list-table-block__column__key"]').should('exist')
        } else {
          cy.log('ℹ️ Empty list - skipping row check')
        }
      })
    })
  })

  describe('Search Functionality', () => {
    it('should show no results for non-matching search', () => {
      tableHelpers.searchAndSubmit('NONEXISTENT_VAR_XYZ999')

      // Deve mostrar mensagem de empty
      cy.get('[data-testid*="list-table-block__empty"], .p-datatable-emptymessage', { timeout: 10000 })
        .should('exist')
    })

    it('should filter variables by search term when data exists', () => {
      cy.get('body').then(($body) => {
        if (!$body.find('[data-testid*="list-table-block__empty"]').length) {
          // Pegar nome da primeira variável e buscar
          cy.get('[data-testid*="list-table-block__column__key"]')
            .first()
            .invoke('text')
            .then((firstKey) => {
              const searchTerm = firstKey.trim().substring(0, 4)

              tableHelpers.searchAndSubmit(searchTerm)

              // Deve encontrar pelo menos um resultado
              cy.get('[data-testid*="list-table-block__column__key"]', { timeout: 10000 })
                .should('have.length.gte', 1)
            })
        } else {
          cy.log('ℹ️ Empty list - skipping search test')
        }
      })
    })
  })

  describe('Table Interactions', () => {
    it('should navigate to edit page when clicking a non-secret row', () => {
      cy.get('body').then(($body) => {
        // Encontrar variável não-secret (value não é *******)
        const nonSecretRows = $body.find('[data-testid*="list-table-block__column__value"]').not(':contains("*******")')

        if (nonSecretRows.length) {
          cy.wrap(nonSecretRows.first())
            .parents('tr')
            .find('[data-testid*="list-table-block__column__key"]')
            .click()

          // Deve navegar para página de edit
          cy.url({ timeout: 10000 }).should('include', '/variables/edit/')

          // Form deve carregar com campo key
          cy.get('[data-testid="variables-form__key-field__input"]', { timeout: 15000 })
            .should('exist')
        } else if ($body.find('[data-testid*="list-table-block__empty"]').length) {
          cy.log('ℹ️ Empty list - skipping navigation test')
        } else {
          cy.log('ℹ️ Only secret variables found - skipping navigation test')
        }
      })
    })
  })
})
