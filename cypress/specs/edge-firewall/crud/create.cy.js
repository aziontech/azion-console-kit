/**
 * Edge Firewall - Create Tests (Self-Contained)
 *
 * API: POST v4/workspace/firewalls
 * Route: /edge-firewall/create
 *
 * Firewall requires: name
 * Modules: DDoS (always enabled), Functions, Network Protection, WAF
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/edge-firewall'

const generateFirewallName = (prefix = 'Firewall') => {
  return `${prefix}_${Date.now()}`
}

describe('Edge Firewall - Create', { tags: ['@crud', '@edge-firewall', '@v4', '@smoke'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Edge Firewall')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
  })

  describe('Firewall Creation', () => {
    it('should navigate to create firewall page', () => {
      cy.get(selectors.createButton, { timeout: 15000 })
        .should('be.visible')
        .click()

      cy.url().should('include', '/edge-firewall/create')
      cy.get(selectors.nameInput, { timeout: 15000 }).should('be.visible')
    })

    it('should display module switches on create page', () => {
      cy.get(selectors.createButton, { timeout: 15000 }).click()

      cy.get(selectors.nameInput, { timeout: 15000 }).should('be.visible')

      // Module switches should be present
      cy.get(selectors.edgeFunctionSwitch, { timeout: 10000 }).should('exist')
      cy.get(selectors.networkProtectionSwitch, { timeout: 10000 }).should('exist')
      cy.get(selectors.wafEnabledSwitch, { timeout: 10000 }).should('exist')
    })

    it('should create a basic firewall with default settings', () => {
      const firewallName = generateFirewallName('Basic')

      cy.get(selectors.createButton, { timeout: 15000 }).click()

      // Fill name
      cy.get(selectors.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(firewallName)

      // Submit
      cy.get(selectors.formActions.saveButton).click()

      // Verify success
      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')
        .and('contain', 'created')
    })

    it('should create a firewall with WAF enabled', () => {
      const firewallName = generateFirewallName('WithWAF')

      cy.get(selectors.createButton, { timeout: 15000 }).click()

      cy.get(selectors.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(firewallName)

      // Enable WAF
      cy.get(selectors.wafEnabledSwitch, { timeout: 10000 }).click()

      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')
    })

    it('should verify created firewall appears in list', () => {
      const firewallName = generateFirewallName('ListCheck')

      cy.get(selectors.createButton, { timeout: 15000 }).click()

      cy.get(selectors.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(firewallName)

      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

      // Navigate back to list
      cy.openProduct('Edge Firewall')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search for created firewall
      tableHelpers.searchAndSubmit(firewallName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', firewallName)
    })
  })

  describe('Validation', () => {
    it('should show error for empty name', () => {
      cy.get(selectors.createButton, { timeout: 15000 }).click()

      cy.get(selectors.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .blur()

      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-error, [data-testid*="error"]', { timeout: 10000 })
        .should('exist')
    })
  })

  describe('Form Actions', () => {
    it('should cancel creation and return to list', () => {
      cy.get(selectors.createButton, { timeout: 15000 }).click()

      cy.get(selectors.nameInput, { timeout: 15000 })
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
