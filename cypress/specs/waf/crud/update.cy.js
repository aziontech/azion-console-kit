/**
 * WAF Rules - Update Tests
 *
 * API: PATCH v4/workspace/wafs/{id}
 * Route: /waf/edit/:id
 *
 * Note: WAF edit uses TabView with async data loading.
 * The Main Settings tab only renders after waf data is loaded.
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/waf-product'

const generateWafName = (prefix = 'WAF') => {
  return `${prefix}_${Date.now()}`
}

// Helper to check if list has data
const hasListData = () => {
  return cy.get('body').then(($body) => {
    const hasTable = $body.find('.p-datatable').length > 0
    const hasRows = $body.find('[data-testid*="list-table-block__column__name"]').length > 0
    return hasTable && hasRows
  })
}

// Wait for WAF edit form to be fully loaded (TabView + EditView)
const waitForWafEditForm = () => {
  // Wait for TabView to render (indicates waf data loaded)
  cy.get('.p-tabview', { timeout: 15000 }).should('be.visible')
  // Wait for Main Settings tab to be active
  cy.get('[data-testid="waf-rules-tabs__tab__main-settings"]', { timeout: 10000 })
    .should('have.class', 'p-tabview-selected')
  // Wait for the name input to be visible
  cy.get(selectors.nameInput, { timeout: 10000 }).should('be.visible')
}

const createWafForUpdate = (name) => {
  cy.get('[data-testid="create_WAF Rule_button"]', { timeout: 15000 }).click()
  cy.get(selectors.nameInput, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(name)
  cy.get('[data-testid="form-actions-submit-button"]').click()
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
  cy.openProduct('WAF Rules')
  tableHelpers.waitForListReady()
}

describe('WAF Rules - Update', { tags: ['@crud', '@waf', '@v4'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('WAF Rules')
    tableHelpers.waitForListReady()
  })

  describe('Edit Navigation', () => {
    it('should navigate to edit page when clicking a row', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          cy.get('[data-testid*="list-table-block__column__name"]')
            .first()
            .click()

          cy.url({ timeout: 15000 }).should('include', '/waf/edit/')
          waitForWafEditForm()
        } else {
          cy.log('No WAF rules - creating one for test')
          const wafName = generateWafName('UPDATE_NAV')
          createWafForUpdate(wafName)

          cy.get('[data-testid*="list-table-block__column__name"]')
            .first()
            .click()
          cy.url({ timeout: 15000 }).should('include', '/waf/edit/')
          waitForWafEditForm()
        }
      })
    })
  })

  describe('Successful Update', () => {
    it('should update WAF rule name', () => {
      const originalName = generateWafName('UPDATE_ORIG')
      const updatedName = generateWafName('UPDATE_NEW')

      createWafForUpdate(originalName)

      tableHelpers.searchAndSubmit(originalName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(originalName)
        .click()

      // Wait for TabView and form to be fully loaded
      waitForWafEditForm()

      cy.get(selectors.nameInput)
        .clear()
        .type(updatedName)

      cy.get('[data-testid="form-actions-submit-button"]').click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')

      cy.openProduct('WAF Rules')
      tableHelpers.waitForListReady()
      tableHelpers.searchAndSubmit(updatedName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', updatedName)
    })
  })

  describe('Form Validation', () => {
    it('should prevent saving with empty name', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          cy.get('[data-testid*="list-table-block__column__name"]')
            .first()
            .click()

          // Wait for TabView and form to be fully loaded
          waitForWafEditForm()

          cy.get(selectors.nameInput)
            .clear()
            .blur()

          cy.get('[data-testid="form-actions-submit-button"]').click()

          cy.get('body').then(($body) => {
            if ($body.find('.p-error, [data-testid*="error"]').length) {
              cy.get('.p-error, [data-testid*="error"]').should('be.visible')
            } else {
              cy.url().should('include', '/waf/edit/')
            }
          })
        } else {
          cy.log('No WAF rules - skipping validation test')
        }
      })
    })
  })
})
