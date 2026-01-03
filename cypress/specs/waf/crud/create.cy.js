/**
 * WAF Rules - Create Tests
 *
 * API: POST v4/workspace/wafs
 * Route: /waf/create
 *
 * Note: WAF uses TabView in edit mode, but create page is a simple form.
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/waf-product'

const generateWafName = (prefix = 'WAF') => {
  return `${prefix}_${Date.now()}`
}

// Wait for create form to be ready
const waitForCreateForm = () => {
  cy.get(selectors.nameInput, { timeout: 15000 }).should('be.visible')
}

describe('WAF Rules - Create', { tags: ['@crud', '@waf', '@v4'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('WAF Rules')
    tableHelpers.waitForListReady()
  })

  describe('Successful Creation', () => {
    it('should create a basic WAF rule with default values', () => {
      const wafName = generateWafName('BasicWAF')

      cy.get(selectors.createButton, { timeout: 15000 }).click()
      waitForCreateForm()

      cy.get(selectors.nameInput)
        .clear()
        .type(wafName)

      cy.get('[data-testid="form-actions-submit-button"]').click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')
        .and('contain', 'created')

      cy.url({ timeout: 15000 }).should('satisfy', (url) => {
        return url.includes('/waf/edit/') || url.includes('/waf')
      })
    })

    it('should verify created WAF rule appears in list', () => {
      const wafName = generateWafName('ListCheck')

      cy.get(selectors.createButton).click()
      waitForCreateForm()

      cy.get(selectors.nameInput)
        .clear()
        .type(wafName)
      cy.get('[data-testid="form-actions-submit-button"]').click()

      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

      cy.openProduct('WAF Rules')
      tableHelpers.waitForListReady()

      tableHelpers.searchAndSubmit(wafName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', wafName)
    })
  })

  describe('Validation Errors', () => {
    it('should show error for empty name', () => {
      cy.get(selectors.createButton).click()
      waitForCreateForm()

      cy.get(selectors.nameInput)
        .clear()
        .blur()

      cy.get('[data-testid="form-actions-submit-button"]').click()

      cy.get('body').then(($body) => {
        if ($body.find('.p-error, [data-testid*="error"]').length) {
          cy.get('.p-error, [data-testid*="error"]').should('be.visible')
        } else {
          cy.url().should('include', '/waf/create')
        }
      })
    })
  })

  describe('Form Actions', () => {
    it('should cancel creation and return to list', () => {
      cy.get(selectors.createButton).click()
      waitForCreateForm()

      cy.get(selectors.nameInput).type('WillBeCancelled')

      cy.get('[data-testid="form-actions-cancel-button"]').click()

      cy.get('body').then(($body) => {
        if ($body.find('.p-dialog-footer button').length) {
          cy.get('.p-dialog-footer button').contains(/leave|discard|confirm/i).click()
        }
      })

      tableHelpers.waitForListReady()
      cy.url().should('match', /\/waf(\?|$)/)
    })
  })
})
