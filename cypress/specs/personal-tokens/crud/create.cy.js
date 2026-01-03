/**
 * Personal Tokens - Create Tests
 *
 * API: POST v4/iam/personal_tokens
 * Route: /personal-tokens/create
 *
 * Note: Personal Token is under Your Settings submenu.
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/personal-tokens'

const generateTokenName = (prefix = 'Token') => {
  return `${prefix}_${Date.now()}`
}

describe('Personal Tokens - Create', { tags: ['@crud', '@personal-tokens', '@v4'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/personal-tokens')
    tableHelpers.waitForListReady()
  })

  describe('Successful Creation', () => {
    it('should create a personal token with default expiration', () => {
      const tokenName = generateTokenName('BasicToken')

      cy.get(selectors.createTokenButton, { timeout: 15000 }).click()

      cy.get(selectors.tokenName, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(tokenName)

      cy.get(selectors.submitButton).click()

      // Token creation shows a copy dialog with the token value
      cy.get(selectors.copyTokenDialogHeader, { timeout: 30000 })
        .should('be.visible')

      // Close the dialog
      cy.get(selectors.closeCopyDialogButton).click()

      // Should return to list or stay on page
      cy.url({ timeout: 15000 }).should('include', '/personal-tokens')
    })

    it('should verify created token appears in list', () => {
      const tokenName = generateTokenName('ListCheck')

      cy.get(selectors.createTokenButton).click()
      cy.get(selectors.tokenName, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(tokenName)
      cy.get(selectors.submitButton).click()

      cy.get(selectors.copyTokenDialogHeader, { timeout: 30000 }).should('be.visible')
      cy.get(selectors.closeCopyDialogButton).click()

      cy.visit('/personal-tokens')
      tableHelpers.waitForListReady()

      tableHelpers.searchAndSubmit(tokenName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', tokenName)
    })

    it('should show copy token button after creation', () => {
      const tokenName = generateTokenName('CopyTest')

      cy.get(selectors.createTokenButton).click()
      cy.get(selectors.tokenName, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(tokenName)
      cy.get(selectors.submitButton).click()

      cy.get(selectors.copyTokenDialogHeader, { timeout: 30000 }).should('be.visible')
      cy.get(selectors.copyTokenButton).should('be.visible')
    })
  })

  describe('Validation Errors', () => {
    it('should show error for empty name', () => {
      cy.get(selectors.createTokenButton).click()

      cy.get(selectors.tokenName, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .blur()

      cy.get(selectors.submitButton).click()

      cy.get('body').then(($body) => {
        if ($body.find('.p-error, [data-testid*="error"]').length) {
          cy.get('.p-error, [data-testid*="error"]').should('be.visible')
        } else {
          cy.url().should('include', '/personal-tokens/create')
        }
      })
    })
  })

  describe('Form Actions', () => {
    it('should cancel creation and return to list', () => {
      cy.get(selectors.createTokenButton).click()

      cy.get(selectors.tokenName, { timeout: 15000 })
        .should('be.visible')
        .type('WillBeCancelled')

      cy.get('[data-testid="form-actions-cancel-button"]').click()

      cy.get('body').then(($body) => {
        if ($body.find('.p-dialog-footer button').length) {
          cy.get('.p-dialog-footer button').contains(/leave|discard|confirm/i).click()
        }
      })

      tableHelpers.waitForListReady()
      cy.url().should('match', /\/personal-tokens(\?|$)/)
    })
  })
})
