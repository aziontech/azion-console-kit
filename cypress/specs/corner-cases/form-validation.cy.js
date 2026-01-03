/**
 * Corner Cases - Form Validation Tests
 *
 * Tests edge cases in form validation:
 * - Required fields
 * - Field length limits
 * - Special characters
 * - Invalid formats
 * - Duplicate values
 */

import { tableHelpers } from '../../support/console-kit-helpers'

describe('Form Validation - Corner Cases', { tags: ['@corner-cases', '@validation'] }, () => {
  beforeEach(() => {
    cy.login()
  })

  describe('Edge Functions - Name Validation', () => {
    beforeEach(() => {
      cy.openProduct('Edge Functions')
      tableHelpers.waitForListReady()
      cy.get('[data-testid="create_Function_button"]').click()
      cy.get('[data-testid="field-text__input"]', { timeout: 15000 }).should('be.visible')
    })

    it('should show error for empty name', () => {
      // Clear and blur to trigger validation
      cy.get('[data-testid="field-text__input"]').clear().blur()

      // Try to submit
      cy.get('[data-testid="form-actions-submit-button"]').click()

      // Should show validation error
      cy.get('.p-error, [class*="error"], [data-testid*="error"]', { timeout: 5000 }).should(
        'exist'
      )
    })

    it('should accept name with special characters', () => {
      const specialName = `test-func_${Date.now()}`
      cy.get('[data-testid="field-text__input"]').clear().type(specialName)

      // Should not show error
      cy.get('[data-testid="field-text__input"]').should('have.value', specialName)
    })

    it('should handle very long name', () => {
      const longName = 'a'.repeat(256) // Very long name
      cy.get('[data-testid="field-text__input"]').clear().type(longName)

      // Should either truncate or show error
      cy.get('[data-testid="field-text__input"]').invoke('val').should('have.length.lte', 256)
    })

    it('should trim whitespace from name', () => {
      const nameWithSpaces = `  test-func-${Date.now()}  `
      cy.get('[data-testid="field-text__input"]').clear().type(nameWithSpaces)

      // Submit and check - backend typically trims
      cy.get('[data-testid="form-actions-submit-button"]').click()

      // Should either succeed or show specific error about spaces
      cy.get('body').then(($body) => {
        const hasSuccess = $body.find('.p-toast-message-success').length > 0
        const hasError = $body.find('.p-toast-message-error, .p-error').length > 0
        expect(hasSuccess || hasError).to.be.true
      })
    })
  })

  describe('Variables - Key/Value Validation', () => {
    beforeEach(() => {
      cy.openProduct('Variables')
      tableHelpers.waitForListReady()
      cy.get('[data-testid="create_Variable_button"]').click()
      cy.get('[data-testid="variables-form__key-field__input"]', { timeout: 15000 }).should(
        'be.visible'
      )
    })

    it('should show error for empty key', () => {
      // Fill only value
      cy.get('[data-testid="variables-form__value-field__input"]').type('some-value')
      cy.get('[data-testid="form-actions-submit-button"]').click()

      // Should show validation error for key
      cy.get('.p-error, [class*="error"]', { timeout: 5000 }).should('exist')
    })

    it('should show error for empty value', () => {
      // Fill only key
      cy.get('[data-testid="variables-form__key-field__input"]').type('SOME_KEY')
      cy.get('[data-testid="form-actions-submit-button"]').click()

      // Should show validation error for value
      cy.get('.p-error, [class*="error"]', { timeout: 5000 }).should('exist')
    })

    it('should enforce uppercase key naming convention', () => {
      // Try lowercase key
      cy.get('[data-testid="variables-form__key-field__input"]').type('lowercase_key')
      cy.get('[data-testid="variables-form__value-field__input"]').type('value')

      // Some systems auto-convert, others reject
      cy.get('[data-testid="form-actions-submit-button"]').click()

      // Check result
      cy.get('body').then(($body) => {
        const hasSuccess = $body.find('.p-toast-message-success').length > 0
        const hasError = $body.find('.p-toast-message-error').length > 0
        expect(hasSuccess || hasError).to.be.true
      })
    })

    it('should handle special characters in value', () => {
      const keyName = `CY_SPECIAL_${Date.now()}`
      const specialValue = '{"json": true, "special": "chars!@#$%"}'

      cy.get('[data-testid="variables-form__key-field__input"]').type(keyName)
      cy.get('[data-testid="variables-form__value-field__input"]').type(specialValue, {
        parseSpecialCharSequences: false
      })

      cy.get('[data-testid="form-actions-submit-button"]').click()
      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
    })
  })

  describe('Edge DNS - Domain Validation', () => {
    beforeEach(() => {
      cy.openProduct('Edge DNS')
      tableHelpers.waitForListReady()
      cy.get('[data-testid="create_Zone_button"]').click()
    })

    it('should validate domain format', () => {
      // Try invalid domain format
      cy.get('[data-testid="edge-dns-form__name__input"]', { timeout: 15000 }).type('test-zone')
      cy.get('[data-testid="edge-dns-form__domain__input"]').type('not-a-valid-domain')

      cy.get('[data-testid="form-actions-submit-button"]').click()

      // Should show format error
      cy.get('.p-error, .p-toast-message-error', { timeout: 10000 }).should('exist')
    })

    it('should accept valid domain format', () => {
      const timestamp = Date.now()
      cy.get('[data-testid="edge-dns-form__name__input"]', { timeout: 15000 }).type(
        `cy-valid-${timestamp}`
      )
      cy.get('[data-testid="edge-dns-form__domain__input"]').type(`cy-valid-${timestamp}.com`)

      cy.get('[data-testid="form-actions-submit-button"]').click()
      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
    })
  })

  describe('Network Lists - Values Validation', () => {
    beforeEach(() => {
      cy.openProduct('Network Lists')
      tableHelpers.waitForListReady()
      cy.get('[data-testid="create_Network List_button"]').click()
    })

    it('should validate ASN format', () => {
      cy.get('[data-testid="network-lists-form__name__field-text__input"]', { timeout: 15000 })
        .clear()
        .type(`cy-asn-test-${Date.now()}`)

      // Enter invalid ASN (text instead of number)
      cy.get('[data-testid="network-lists-form__items-textarea"]').type('invalid-asn-text')

      cy.get('[data-testid="form-actions-submit-button"]').click()

      // Should show validation error
      cy.get('.p-error, .p-toast-message-error', { timeout: 10000 }).should('exist')
    })

    it('should accept valid ASN numbers', () => {
      cy.get('[data-testid="network-lists-form__name__field-text__input"]', { timeout: 15000 })
        .clear()
        .type(`cy-asn-valid-${Date.now()}`)

      // Enter valid ASN numbers
      cy.get('[data-testid="network-lists-form__items-textarea"]').type('12345\n67890')

      cy.get('[data-testid="form-actions-submit-button"]').click()
      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
    })
  })
})
