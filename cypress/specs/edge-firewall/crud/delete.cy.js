/**
 * Edge Firewall - Delete Tests (Self-Contained)
 *
 * API: DELETE v4/workspace/firewalls/:id
 * Route: /edge-firewall
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/edge-firewall'

const generateFirewallName = (prefix = 'Firewall') => {
  return `${prefix}_${Date.now()}`
}

// Helper to create a firewall
const createFirewall = (name) => {
  cy.get(selectors.createButton, { timeout: 15000 }).click()

  cy.get(selectors.nameInput, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(name)

  cy.get(selectors.formActions.saveButton).click()

  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
}

describe('Edge Firewall - Delete', { tags: ['@crud', '@edge-firewall', '@v4', '@smoke'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Edge Firewall')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
  })

  describe('Delete Firewall', () => {
    it('should show delete action in row actions', () => {
      const firewallName = generateFirewallName('DeleteActionTest')

      createFirewall(firewallName)

      // Go back to list
      cy.openProduct('Edge Firewall')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search for the firewall
      tableHelpers.searchAndSubmit(firewallName)

      // Check for action button
      cy.get('[data-testid*="actions"]', { timeout: 15000 }).should('exist')
    })

    it('should delete firewall via single action button', () => {
      const firewallName = generateFirewallName('SingleDelete')

      createFirewall(firewallName)

      // Go back to list
      cy.openProduct('Edge Firewall')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search for the firewall
      tableHelpers.searchAndSubmit(firewallName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', firewallName)

      // Try single action button first
      cy.get('body').then(($body) => {
        if ($body.find(selectors.actions.singleActionButton).length) {
          cy.get(selectors.actions.singleActionButton).first().click()
        } else if ($body.find(selectors.actions.menuButton).length) {
          cy.get(selectors.actions.menuButton).first().click()
          cy.get('.p-menuitem-link').contains(/delete/i).click()
        }
      })

      // Confirm deletion - use firewall name for confirmation
      cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
        .should('be.visible')
        .type(firewallName)

      cy.get(selectors.deleteDialog.deleteButton).click()

      // Verify deletion success
      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')
        .and('contain', 'deleted')
    })

    it('should delete firewall via actions menu', () => {
      const firewallName = generateFirewallName('MenuDelete')

      createFirewall(firewallName)

      // Go back to list
      cy.openProduct('Edge Firewall')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search for the firewall
      tableHelpers.searchAndSubmit(firewallName)

      // Check if actions menu exists
      cy.get('body').then(($body) => {
        if ($body.find(selectors.actions.menuButton).length) {
          cy.get(selectors.actions.menuButton).first().click()

          // Click delete in menu
          cy.get('.p-menuitem-link', { timeout: 5000 })
            .contains(/delete/i)
            .click()

          // Confirm deletion
          cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
            .should('be.visible')
            .type(firewallName)

          cy.get(selectors.deleteDialog.deleteButton).click()

          cy.get('.p-toast-message-success', { timeout: 30000 })
            .should('be.visible')
        } else {
          // Use single action button if menu doesn't exist
          cy.get(selectors.actions.singleActionButton).first().click()

          cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
            .should('be.visible')
            .type(firewallName)

          cy.get(selectors.deleteDialog.deleteButton).click()

          cy.get('.p-toast-message-success', { timeout: 30000 })
            .should('be.visible')
        }
      })
    })

    it('should cancel delete operation', () => {
      const firewallName = generateFirewallName('CancelDelete')

      createFirewall(firewallName)

      // Go back to list
      cy.openProduct('Edge Firewall')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search for the firewall
      tableHelpers.searchAndSubmit(firewallName)

      // Open delete dialog
      cy.get('body').then(($body) => {
        if ($body.find(selectors.actions.singleActionButton).length) {
          cy.get(selectors.actions.singleActionButton).first().click()
        } else if ($body.find(selectors.actions.menuButton).length) {
          cy.get(selectors.actions.menuButton).first().click()
          cy.get('.p-menuitem-link').contains(/delete/i).click()
        }
      })

      // Cancel deletion
      cy.get(selectors.deleteDialog.cancelButton, { timeout: 10000 }).click()

      // Verify firewall still exists
      tableHelpers.searchAndSubmit(firewallName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', firewallName)
    })

    it('should require correct firewall name for confirmation', () => {
      const firewallName = generateFirewallName('WrongConfirm')

      createFirewall(firewallName)

      // Go back to list
      cy.openProduct('Edge Firewall')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search for the firewall
      tableHelpers.searchAndSubmit(firewallName)

      // Open delete dialog
      cy.get('body').then(($body) => {
        if ($body.find(selectors.actions.singleActionButton).length) {
          cy.get(selectors.actions.singleActionButton).first().click()
        } else if ($body.find(selectors.actions.menuButton).length) {
          cy.get(selectors.actions.menuButton).first().click()
          cy.get('.p-menuitem-link').contains(/delete/i).click()
        }
      })

      // Type wrong confirmation
      cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
        .should('be.visible')
        .type('wrong-name')

      // Delete button should be disabled or click should not proceed
      cy.get(selectors.deleteDialog.deleteButton).then(($btn) => {
        if ($btn.is(':disabled')) {
          cy.wrap($btn).should('be.disabled')
        } else {
          cy.wrap($btn).click()
          cy.get(selectors.deleteDialog.confirmInput).should('be.visible')
        }
      })

      // Cancel to clean up
      cy.get(selectors.deleteDialog.cancelButton).click()
    })

    it('should remove firewall from list after successful deletion', () => {
      const firewallName = generateFirewallName('RemoveFromList')

      createFirewall(firewallName)

      // Go back to list
      cy.openProduct('Edge Firewall')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search and verify firewall exists
      tableHelpers.searchAndSubmit(firewallName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', firewallName)

      // Delete the firewall
      cy.get('body').then(($body) => {
        if ($body.find(selectors.actions.singleActionButton).length) {
          cy.get(selectors.actions.singleActionButton).first().click()
        } else if ($body.find(selectors.actions.menuButton).length) {
          cy.get(selectors.actions.menuButton).first().click()
          cy.get('.p-menuitem-link').contains(/delete/i).click()
        }
      })

      cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
        .should('be.visible')
        .type(firewallName)

      cy.get(selectors.deleteDialog.deleteButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

      // Verify firewall is no longer in list
      tableHelpers.searchAndSubmit(firewallName)
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 10000 })
        .should('exist')
    })
  })
})
