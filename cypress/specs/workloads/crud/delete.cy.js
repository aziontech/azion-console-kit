/**
 * Workloads - Delete CRUD Tests
 *
 * API: DELETE v4/workspace/workloads/{id}
 * Route: /domains
 *
 * Tests: Delete workload/domain functionality
 *
 * Note: Workloads is the v4 replacement for Domains
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/workload'

const generateName = (prefix = 'Workload') => {
  return `${prefix}-${Date.now()}`
}

describe('Workloads - Delete', { tags: ['@crud', '@workloads', '@domains'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Domains')
    tableHelpers.waitForListReady()
  })

  // Helper to create a workload for deletion tests
  const createWorkloadForDeletion = (name) => {
    cy.intercept('POST', '**/workloads').as('createWorkload')

    // Navigate to create
    cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

    // Fill name
    cy.get(selectors.nameInput, { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type(name)

    // Select Edge Application
    cy.get(selectors.edgeApplicationField, { timeout: 10000 }).click()
    cy.get('li[role="option"]', { timeout: 15000 }).first().click()

    // Save
    cy.get(selectors.formActionsSubmitButton).click()

    cy.wait('@createWorkload', { timeout: 30000 })

    // Handle dialog if present
    cy.get('body', { timeout: 15000 }).then(($body) => {
      if ($body.find(selectors.confirmButton).length > 0) {
        cy.get(selectors.confirmButton).click()
      }
    })

    // Return to list
    cy.openProduct('Domains')
    tableHelpers.waitForListReady()
  }

  describe('Delete from List', () => {
    it('should delete workload from action button', () => {
      const workloadName = generateName('ToDelete')

      createWorkloadForDeletion(workloadName)

      cy.intercept('DELETE', '**/workloads/**').as('deleteWorkload')

      // Search for the workload
      tableHelpers.searchAndSubmit(workloadName)

      // Find the row and click delete action
      cy.get(selectors.listTableBlockColumnNameRow, { timeout: 30000 })
        .contains(workloadName)
        .parents('tr')
        .find('[data-testid*="action"], .pi-trash, .pi-ellipsis-v')
        .first()
        .click()

      // If menu appears, click delete option
      cy.get('body').then(($body) => {
        if ($body.find('.p-menu, .p-tieredmenu').length > 0) {
          cy.contains('Delete').click()
        }
      })

      // Confirm deletion in dialog
      cy.get('[data-testid*="confirmation-input"], [data-testid*="confirm-input"], [data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
        .clear()
        .type(workloadName)

      cy.get('[data-testid*="delete-button"], [data-testid="delete-dialog-footer-delete-button"]').click()

      // Wait for API call
      cy.wait('@deleteWorkload', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 202, 204])

      // Verify success message
      cy.get('.p-toast-message-success, .p-toast-message-info', { timeout: 10000 }).should('exist')

      // Verify workload is no longer in list
      cy.get('body', { timeout: 10000 }).should('not.contain', workloadName)
    })

    it('should require confirmation to delete', () => {
      const workloadName = generateName('ConfirmDelete')

      createWorkloadForDeletion(workloadName)

      // Search for the workload
      tableHelpers.searchAndSubmit(workloadName)

      // Find the row and click delete action
      cy.get(selectors.listTableBlockColumnNameRow, { timeout: 30000 })
        .contains(workloadName)
        .parents('tr')
        .find('[data-testid*="action"], .pi-trash, .pi-ellipsis-v')
        .first()
        .click()

      // If menu appears, click delete option
      cy.get('body').then(($body) => {
        if ($body.find('.p-menu, .p-tieredmenu').length > 0) {
          cy.contains('Delete').click()
        }
      })

      // Verify confirmation dialog appears
      cy.get('[data-testid*="confirmation-input"], [data-testid*="confirm-input"], [data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
        .should('be.visible')

      // Cancel deletion
      cy.get('[data-testid*="cancel"], .p-dialog-close-button, .p-button-secondary').first().click()

      // Workload should still exist
      cy.get(selectors.listTableBlockColumnNameRow).should('contain', workloadName)

      // Cleanup - actually delete it
      cy.get(selectors.listTableBlockColumnNameRow)
        .contains(workloadName)
        .parents('tr')
        .find('[data-testid*="action"], .pi-trash, .pi-ellipsis-v')
        .first()
        .click()

      cy.get('body').then(($body) => {
        if ($body.find('.p-menu, .p-tieredmenu').length > 0) {
          cy.contains('Delete').click()
        }
      })

      cy.get('[data-testid*="confirmation-input"], [data-testid*="confirm-input"], [data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
        .clear()
        .type(workloadName)

      cy.get('[data-testid*="delete-button"], [data-testid="delete-dialog-footer-delete-button"]').click()

      cy.get('.p-toast-message-success, .p-toast-message-info', { timeout: 10000 }).should('exist')
    })

    it('should not delete with wrong confirmation text', () => {
      const workloadName = generateName('WrongConfirm')

      createWorkloadForDeletion(workloadName)

      // Search for the workload
      tableHelpers.searchAndSubmit(workloadName)

      // Find the row and click delete action
      cy.get(selectors.listTableBlockColumnNameRow, { timeout: 30000 })
        .contains(workloadName)
        .parents('tr')
        .find('[data-testid*="action"], .pi-trash, .pi-ellipsis-v')
        .first()
        .click()

      cy.get('body').then(($body) => {
        if ($body.find('.p-menu, .p-tieredmenu').length > 0) {
          cy.contains('Delete').click()
        }
      })

      // Type wrong confirmation text
      cy.get('[data-testid*="confirmation-input"], [data-testid*="confirm-input"], [data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
        .clear()
        .type('wrong-text')

      // Delete button should be disabled or click should fail
      cy.get('[data-testid*="delete-button"], [data-testid="delete-dialog-footer-delete-button"]').then(($btn) => {
        if ($btn.is(':disabled')) {
          expect($btn).to.be.disabled
        } else {
          // Click and verify no deletion happened
          cy.wrap($btn).click()
          // Should still show dialog or error
          cy.get('[data-testid*="confirmation-input"], [data-testid*="confirm-input"], .p-toast-message-error', { timeout: 5000 }).should('exist')
        }
      })

      // Cancel and cleanup
      cy.get('[data-testid*="cancel"], .p-dialog-close-button, .p-button-secondary').first().click()

      // Actually delete for cleanup
      cy.get(selectors.listTableBlockColumnNameRow)
        .contains(workloadName)
        .parents('tr')
        .find('[data-testid*="action"], .pi-trash, .pi-ellipsis-v')
        .first()
        .click()

      cy.get('body').then(($body) => {
        if ($body.find('.p-menu, .p-tieredmenu').length > 0) {
          cy.contains('Delete').click()
        }
      })

      cy.get('[data-testid*="confirmation-input"], [data-testid*="confirm-input"], [data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
        .clear()
        .type(workloadName)

      cy.get('[data-testid*="delete-button"], [data-testid="delete-dialog-footer-delete-button"]').click()
    })
  })

  describe('Delete Multiple Workloads', () => {
    it('should delete multiple workloads sequentially', () => {
      const workload1 = generateName('Multi1')
      const workload2 = generateName('Multi2')

      // Create two workloads
      createWorkloadForDeletion(workload1)
      createWorkloadForDeletion(workload2)

      cy.intercept('DELETE', '**/workloads/**').as('deleteWorkload')

      // Delete first workload
      tableHelpers.searchAndSubmit(workload1)

      cy.get(selectors.listTableBlockColumnNameRow, { timeout: 30000 })
        .contains(workload1)
        .parents('tr')
        .find('[data-testid*="action"], .pi-trash, .pi-ellipsis-v')
        .first()
        .click()

      cy.get('body').then(($body) => {
        if ($body.find('.p-menu, .p-tieredmenu').length > 0) {
          cy.contains('Delete').click()
        }
      })

      cy.get('[data-testid*="confirmation-input"], [data-testid*="confirm-input"], [data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
        .clear()
        .type(workload1)

      cy.get('[data-testid*="delete-button"], [data-testid="delete-dialog-footer-delete-button"]').click()

      cy.wait('@deleteWorkload', { timeout: 30000 })

      cy.get('.p-toast-message-success, .p-toast-message-info', { timeout: 10000 }).should('exist')

      // Wait for toast to disappear
      cy.wait(2000)

      // Delete second workload
      tableHelpers.searchAndSubmit(workload2)

      cy.get(selectors.listTableBlockColumnNameRow, { timeout: 30000 })
        .contains(workload2)
        .parents('tr')
        .find('[data-testid*="action"], .pi-trash, .pi-ellipsis-v')
        .first()
        .click()

      cy.get('body').then(($body) => {
        if ($body.find('.p-menu, .p-tieredmenu').length > 0) {
          cy.contains('Delete').click()
        }
      })

      cy.get('[data-testid*="confirmation-input"], [data-testid*="confirm-input"], [data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
        .clear()
        .type(workload2)

      cy.get('[data-testid*="delete-button"], [data-testid="delete-dialog-footer-delete-button"]').click()

      cy.wait('@deleteWorkload', { timeout: 30000 })

      cy.get('.p-toast-message-success, .p-toast-message-info', { timeout: 10000 }).should('exist')
    })
  })
})
