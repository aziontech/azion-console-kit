/**
 * Edge DNS - Delete Tests (Self-Contained)
 *
 * API: DELETE v4/workspace/dns/zones/:id
 * Route: /edge-dns
 *
 * Tests delete operations for DNS zones
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/edge-dns'

const generateZoneName = (prefix = 'Zone') => {
  return `${prefix}_${Date.now()}`
}

const generateDomain = (prefix = 'test') => {
  return `${prefix}${Date.now()}.example.com`
}

describe('Edge DNS - Delete', { tags: ['@crud', '@edge-dns', '@v4', '@smoke'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Edge DNS')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
  })

  describe('Delete Zone', () => {
    it('should show delete action in row actions', () => {
      // Create a zone first
      const zoneName = generateZoneName('DeleteActionTest')
      const domain = generateDomain('deleteaction')

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

      // Go back to list
      cy.openProduct('Edge DNS')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search for the zone
      tableHelpers.searchAndSubmit(zoneName)

      // Check for action button
      cy.get('[data-testid*="actions"]', { timeout: 15000 }).should('exist')
    })

    it('should delete zone via single action button', () => {
      // Create a zone to delete
      const zoneName = generateZoneName('SingleDelete')
      const domain = generateDomain('singledelete')

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

      // Go back to list
      cy.openProduct('Edge DNS')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search for the zone
      tableHelpers.searchAndSubmit(zoneName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', zoneName)

      // Try single action button first (delete icon)
      cy.get('body').then(($body) => {
        if ($body.find(selectors.actions.singleActionButton).length) {
          cy.get(selectors.actions.singleActionButton).first().click()
        } else if ($body.find(selectors.actions.menuButton).length) {
          // Fallback to menu button
          cy.get(selectors.actions.menuButton).first().click()
          cy.get('.p-menuitem-link').contains(/delete/i).click()
        }
      })

      // Confirm deletion - use zone name for confirmation
      cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
        .should('be.visible')
        .type(zoneName)

      cy.get(selectors.deleteDialog.deleteButton).click()

      // Verify deletion success
      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')
        .and('contain', 'deleted')
    })

    it('should delete zone via actions menu', () => {
      // Create a zone to delete
      const zoneName = generateZoneName('MenuDelete')
      const domain = generateDomain('menudelete')

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

      // Go back to list
      cy.openProduct('Edge DNS')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search for the zone
      tableHelpers.searchAndSubmit(zoneName)

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
            .type(zoneName)

          cy.get(selectors.deleteDialog.deleteButton).click()

          cy.get('.p-toast-message-success', { timeout: 30000 })
            .should('be.visible')
        } else {
          // Use single action button if menu doesn't exist
          cy.get(selectors.actions.singleActionButton).first().click()

          cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
            .should('be.visible')
            .type(zoneName)

          cy.get(selectors.deleteDialog.deleteButton).click()

          cy.get('.p-toast-message-success', { timeout: 30000 })
            .should('be.visible')
        }
      })
    })

    it('should cancel delete operation', () => {
      // Create a zone
      const zoneName = generateZoneName('CancelDelete')
      const domain = generateDomain('canceldelete')

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

      // Go back to list
      cy.openProduct('Edge DNS')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search for the zone
      tableHelpers.searchAndSubmit(zoneName)

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

      // Verify zone still exists
      tableHelpers.searchAndSubmit(zoneName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', zoneName)
    })

    it('should require correct zone name for confirmation', () => {
      // Create a zone
      const zoneName = generateZoneName('WrongConfirm')
      const domain = generateDomain('wrongconfirm')

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

      // Go back to list
      cy.openProduct('Edge DNS')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search for the zone
      tableHelpers.searchAndSubmit(zoneName)

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
          // If not disabled, click and verify no deletion happens
          cy.wrap($btn).click()
          // Dialog should still be open or show error
          cy.get(selectors.deleteDialog.confirmInput).should('be.visible')
        }
      })

      // Cancel to clean up
      cy.get(selectors.deleteDialog.cancelButton).click()
    })

    it('should remove zone from list after successful deletion', () => {
      // Create a zone
      const zoneName = generateZoneName('RemoveFromList')
      const domain = generateDomain('removefromlist')

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

      // Go back to list
      cy.openProduct('Edge DNS')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search and verify zone exists
      tableHelpers.searchAndSubmit(zoneName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', zoneName)

      // Delete the zone
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
        .type(zoneName)

      cy.get(selectors.deleteDialog.deleteButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

      // Verify zone is no longer in list
      tableHelpers.searchAndSubmit(zoneName)
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 10000 })
        .should('exist')
    })
  })
})
