/**
 * Network Lists - Create Tests (Self-Contained)
 *
 * API: POST v4/workspace/network_lists
 * Route: /network-lists/create
 *
 * Tipos: asn (default), ip_cidr, countries
 *
 * Seletores corretos:
 * - Name input: network-list-form__name__input
 * - ASN textarea: network-list-form__asn-list__textarea
 * - IP/CIDR textarea: network-list-form__ipcidr-list__textarea
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/network-lists'

const generateListName = (prefix = 'NetList') => {
  return `${prefix}_${Date.now()}`
}

describe('Network Lists - Create', { tags: ['@crud', '@network-lists', '@v4'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Network Lists')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
  })

  describe('Successful Creation', () => {
    it('should create an ASN network list', () => {
      const listName = generateListName('ASN')

      cy.get(selectors.createButton, { timeout: 15000 }).click()

      // Fill name
      cy.get(selectors.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(listName)

      // ASN is the default type, just fill the values
      cy.get(selectors.asnTextarea, { timeout: 10000 })
        .should('be.visible')
        .type('12345\n67890')

      // Submit
      cy.get(selectors.saveButton).click()

      // Verify success toast
      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')
        .and('contain', 'created')
    })

    it('should create an IP/CIDR network list', () => {
      const listName = generateListName('IPCIDR')

      cy.get(selectors.createButton, { timeout: 15000 }).click()

      // Fill name
      cy.get(selectors.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(listName)

      // Select IP/CIDR type (second radio button)
      cy.get('.p-radiobutton-box').eq(1).click()

      // Wait for IP/CIDR textarea to appear
      cy.get(selectors.ipcidrTextarea, { timeout: 10000 })
        .should('be.visible')
        .type('192.168.1.0/24\n10.0.0.0/8')

      // Submit
      cy.get(selectors.saveButton).click()

      // Verify success toast
      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')
        .and('contain', 'created')
    })

    it('should verify created list appears in list view', () => {
      const listName = generateListName('ListCheck')

      cy.get(selectors.createButton, { timeout: 15000 }).click()

      cy.get(selectors.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(listName)

      // Fill ASN values (default type)
      cy.get(selectors.asnTextarea, { timeout: 10000 })
        .should('be.visible')
        .type('11111')

      cy.get(selectors.saveButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

      // Navigate back to list
      cy.openProduct('Network Lists')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search for created list
      tableHelpers.searchAndSubmit(listName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', listName)
    })
  })

  describe('Validation Errors', () => {
    it('should show error for empty name', () => {
      cy.get(selectors.createButton, { timeout: 15000 }).click()

      cy.get(selectors.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .blur()

      cy.get(selectors.saveButton).click()

      // Should show error or stay on create page
      cy.get('body').then(($body) => {
        if ($body.find('.p-error, [data-testid*="error"]').length) {
          cy.get('.p-error, [data-testid*="error"]').should('be.visible')
        } else {
          cy.url().should('include', '/network-lists/create')
        }
      })
    })
  })

  describe('Form Actions', () => {
    it('should cancel creation and return to list', () => {
      cy.get(selectors.createButton, { timeout: 15000 }).click()

      cy.get(selectors.nameInput, { timeout: 15000 })
        .should('be.visible')
        .type('WillBeCancelled')

      cy.get(selectors.cancelButton).click()

      // Handle potential confirmation dialog
      cy.get('body').then(($body) => {
        if ($body.find('.p-dialog-footer button').length) {
          cy.get('.p-dialog-footer button').contains(/leave|discard|confirm/i).click()
        }
      })

      cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
    })
  })
})
