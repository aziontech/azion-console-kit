/**
 * Edge DNS - Create Tests (Self-Contained)
 *
 * API: POST v4/workspace/dns/zones
 * Route: /edge-dns/create
 *
 * Zone requires: name, domain (valid format)
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/edge-dns'

const generateZoneName = (prefix = 'Zone') => {
  return `${prefix}_${Date.now()}`
}

const generateDomain = (prefix = 'test') => {
  return `${prefix}${Date.now()}.example.com`
}

describe('Edge DNS - Create', { tags: ['@crud', '@edge-dns', '@v4', '@smoke'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Edge DNS')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
  })

  describe('Zone Creation', () => {
    it('should navigate to create zone page', () => {
      cy.get(selectors.createButton, { timeout: 15000 })
        .should('be.visible')
        .click()

      cy.url().should('include', '/edge-dns/create')
      cy.get(selectors.form.nameInput, { timeout: 15000 }).should('be.visible')
    })

    it('should create a DNS zone with valid data', () => {
      const zoneName = generateZoneName('DNSZone')
      const domain = generateDomain('dns')

      cy.get(selectors.createButton, { timeout: 15000 }).click()

      // Fill zone name
      cy.get(selectors.form.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(zoneName)

      // Fill domain
      cy.get(selectors.form.domainInput, { timeout: 10000 })
        .should('be.visible')
        .clear()
        .type(domain)

      // Submit
      cy.get(selectors.formActions.saveButton).click()

      // Verify success
      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')
        .and('contain', 'created')
    })

    it('should verify created zone appears in list', () => {
      const zoneName = generateZoneName('ListCheck')
      const domain = generateDomain('listcheck')

      cy.get(selectors.createButton, { timeout: 15000 }).click()

      cy.get(selectors.form.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(zoneName)

      cy.get(selectors.form.domainInput, { timeout: 10000 })
        .should('be.visible')
        .clear()
        .type(domain)

      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

      // Navigate back to list
      cy.openProduct('Edge DNS')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search for created zone
      tableHelpers.searchAndSubmit(zoneName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', zoneName)
    })
  })

  describe('Validation', () => {
    it('should show error for empty name', () => {
      cy.get(selectors.createButton, { timeout: 15000 }).click()

      cy.get(selectors.form.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .blur()

      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-error, [data-testid*="error"]', { timeout: 10000 })
        .should('exist')
    })

    it('should show error for invalid domain format', () => {
      const zoneName = generateZoneName('InvalidDomain')

      cy.get(selectors.createButton, { timeout: 15000 }).click()

      cy.get(selectors.form.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(zoneName)

      // Invalid domain (no TLD)
      cy.get(selectors.form.domainInput, { timeout: 10000 })
        .should('be.visible')
        .clear()
        .type('invalid-domain-no-tld')
        .blur()

      cy.get(selectors.formActions.saveButton).click()

      // Should show error or stay on create page
      cy.get('body').then(($body) => {
        if ($body.find('.p-error, [data-testid*="error"]').length) {
          cy.get('.p-error, [data-testid*="error"]').should('be.visible')
        } else {
          cy.url().should('include', '/edge-dns/create')
        }
      })
    })
  })

  describe('Form Actions', () => {
    it('should cancel creation and return to list', () => {
      cy.get(selectors.createButton, { timeout: 15000 }).click()

      cy.get(selectors.form.nameInput, { timeout: 15000 })
        .should('be.visible')
        .type('WillBeCancelled')

      cy.get(selectors.formActions.cancelButton).click()

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
