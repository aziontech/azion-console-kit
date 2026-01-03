/**
 * Edge Applications - Delete Tests (Self-Contained)
 *
 * API: DELETE v4/workspace/applications/:id
 * Route: /edge-application
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/edge-application'

const generateAppName = (prefix = 'App') => {
  return `${prefix}_${Date.now()}`
}

// Helper to create an application
const createApplication = (name) => {
  cy.get(selectors.mainSettings.createButton, { timeout: 15000 }).click()

  cy.get(selectors.mainSettings.nameInput, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(name)

  // If v4 form with address field
  cy.get('body').then(($body) => {
    if ($body.find(selectors.mainSettings.addressInput).length) {
      cy.get(selectors.mainSettings.addressInput)
        .clear()
        .type('httpbin.org')
    }
  })

  cy.get(selectors.formActions.saveButton).click()

  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
}

describe('Edge Applications - Delete', { tags: ['@crud', '@edge-applications', '@v4', '@smoke'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Edge Application')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
  })

  describe('Delete Application', () => {
    it('should show delete action in row actions', () => {
      const appName = generateAppName('DeleteActionTest')

      createApplication(appName)

      // Go back to list
      cy.openProduct('Edge Application')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search for the application
      tableHelpers.searchAndSubmit(appName)

      // Check for action button
      cy.get('[data-testid*="actions"]', { timeout: 15000 }).should('exist')
    })

    it('should delete application via single action button', () => {
      const appName = generateAppName('SingleDelete')

      createApplication(appName)

      // Go back to list
      cy.openProduct('Edge Application')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search for the application
      tableHelpers.searchAndSubmit(appName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', appName)

      // Try single action button first
      cy.get('body').then(($body) => {
        if ($body.find(selectors.actions.singleActionButton).length) {
          cy.get(selectors.actions.singleActionButton).first().click()
        } else if ($body.find(selectors.actions.menuButton).length) {
          cy.get(selectors.actions.menuButton).first().click()
          cy.get('.p-menuitem-link').contains(/delete/i).click()
        }
      })

      // Confirm deletion - use application name for confirmation
      cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
        .should('be.visible')
        .type(appName)

      cy.get(selectors.deleteDialog.deleteButton).click()

      // Verify deletion success
      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')
        .and('contain', 'deleted')
    })

    it('should cancel delete operation', () => {
      const appName = generateAppName('CancelDelete')

      createApplication(appName)

      // Go back to list
      cy.openProduct('Edge Application')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search for the application
      tableHelpers.searchAndSubmit(appName)

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

      // Verify application still exists
      tableHelpers.searchAndSubmit(appName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', appName)
    })

    it('should require correct application name for confirmation', () => {
      const appName = generateAppName('WrongConfirm')

      createApplication(appName)

      // Go back to list
      cy.openProduct('Edge Application')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search for the application
      tableHelpers.searchAndSubmit(appName)

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

    it('should remove application from list after successful deletion', () => {
      const appName = generateAppName('RemoveFromList')

      createApplication(appName)

      // Go back to list
      cy.openProduct('Edge Application')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search and verify application exists
      tableHelpers.searchAndSubmit(appName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', appName)

      // Delete the application
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
        .type(appName)

      cy.get(selectors.deleteDialog.deleteButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

      // Verify application is no longer in list
      tableHelpers.searchAndSubmit(appName)
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 10000 })
        .should('exist')
    })
  })
})
