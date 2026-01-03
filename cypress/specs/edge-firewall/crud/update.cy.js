/**
 * Edge Firewall - Update Tests (Self-Contained)
 *
 * API: PATCH v4/workspace/firewalls/:id
 * Route: /edge-firewall/edit/:id
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/edge-firewall'

const generateFirewallName = (prefix = 'Firewall') => {
  return `${prefix}_${Date.now()}`
}

describe('Edge Firewall - Update', { tags: ['@crud', '@edge-firewall', '@v4', '@smoke'] }, () => {
  let testFirewallName

  before(() => {
    // Create a firewall to use for update tests
    testFirewallName = generateFirewallName('UpdateTest')

    cy.login()
    cy.openProduct('Edge Firewall')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

    cy.get(selectors.createButton, { timeout: 15000 }).click()

    cy.get(selectors.nameInput, { timeout: 15000 })
      .should('be.visible')
      .clear()
      .type(testFirewallName)

    cy.get(selectors.formActions.saveButton).click()

    cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
  })

  beforeEach(() => {
    cy.login()
    cy.openProduct('Edge Firewall')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
  })

  describe('Firewall Update', () => {
    it('should navigate to edit page for existing firewall', () => {
      tableHelpers.searchAndSubmit(testFirewallName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testFirewallName)
        .click()

      cy.url({ timeout: 15000 }).should('include', '/edge-firewall/edit/')
      cy.get(selectors.nameInput, { timeout: 15000 }).should('be.visible')
    })

    it('should load firewall data in edit form', () => {
      tableHelpers.searchAndSubmit(testFirewallName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testFirewallName)
        .click()

      cy.get(selectors.nameInput, { timeout: 15000 })
        .should('have.value', testFirewallName)
    })

    it('should update firewall name', () => {
      const newName = `${testFirewallName}_Updated`

      tableHelpers.searchAndSubmit(testFirewallName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testFirewallName)
        .click()

      cy.get(selectors.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(newName)

      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')

      // Update test firewall name for subsequent tests
      testFirewallName = newName
    })

    it('should toggle module switches', () => {
      tableHelpers.searchAndSubmit(testFirewallName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testFirewallName)
        .click()

      // Toggle WAF switch
      cy.get(selectors.wafEnabledSwitch, { timeout: 10000 }).click()

      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-toast-message', { timeout: 30000 }).should('be.visible')
    })
  })

  describe('Tab Navigation', () => {
    it('should navigate to Functions tab', () => {
      tableHelpers.searchAndSubmit(testFirewallName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testFirewallName)
        .click()

      // Wait for tabs to load
      cy.get('.p-tabview-nav', { timeout: 15000 }).should('exist')

      // Click Functions tab if it exists
      cy.get('body').then(($body) => {
        if ($body.find(selectors.functionsTab).length) {
          cy.get(selectors.functionsTab).click()
          cy.url().should('include', '/functions')
        }
      })
    })

    it('should navigate to Rules Engine tab', () => {
      tableHelpers.searchAndSubmit(testFirewallName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testFirewallName)
        .click()

      cy.get('.p-tabview-nav', { timeout: 15000 }).should('exist')

      // Click Rules Engine tab if it exists
      cy.get('body').then(($body) => {
        if ($body.find(selectors.rulesEngineTab).length) {
          cy.get(selectors.rulesEngineTab).click()
          cy.url().should('include', '/rules-engine')
        }
      })
    })
  })

  describe('Validation on Update', () => {
    it('should show error when clearing required name field', () => {
      tableHelpers.searchAndSubmit(testFirewallName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testFirewallName)
        .click()

      cy.get(selectors.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .blur()

      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-error, [data-testid*="error"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Cancel Update', () => {
    it('should discard changes on cancel', () => {
      const originalName = testFirewallName

      tableHelpers.searchAndSubmit(testFirewallName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testFirewallName)
        .click()

      cy.get(selectors.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type('WillBeCancelled')

      cy.get(selectors.formActions.cancelButton).click()

      // Handle potential confirmation dialog
      cy.get('body').then(($body) => {
        if ($body.find('.p-dialog-footer button').length) {
          cy.get('.p-dialog-footer button').contains(/leave|discard|confirm/i).click()
        }
      })

      cy.get('.p-datatable', { timeout: 30000 }).should('exist')

      // Verify original firewall still exists
      tableHelpers.searchAndSubmit(originalName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', originalName)
    })
  })
})
