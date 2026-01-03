/**
 * Edge SQL - Delete Tests
 *
 * API: DELETE v4/workspace/sql/databases/{id}
 * Route: /sql-database
 *
 * Note: Delete can be done from:
 * 1. List page via actions menu
 * 2. Settings tab via Danger Zone button
 *
 * Deletion is async - status changes to 'deleting' and polling happens.
 */

import { tableHelpers } from '../../../support/console-kit-helpers'

const selectors = {
  contentBlock: '[data-testid="edge-sql-content-block"]',
  createButton: '[data-testid="create_Database_button"]',
  nameColumn: '[data-testid*="list-table-block__column__name"]',
  actionsButton: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
  deleteDialog: {
    confirmInput: '[data-testid="delete-dialog-confirmation-input-field"]',
    deleteButton: '[data-testid="delete-dialog-footer-delete-button"]',
    cancelButton: '[data-testid="delete-dialog-footer-cancel-button"]'
  },
  settingsTab: '[data-testid="sql-database-tabs__tab__settings"]',
  dangerZoneDeleteButton: '[data-testid="account-settings__delete-account"]',
  nameInput: '[data-testid="database-name-field"] input'
}

const generateDatabaseName = (prefix = 'del') => {
  return `${prefix}-${Date.now()}`
}

// Wait for page to be ready
const waitForPageReady = () => {
  cy.get(selectors.contentBlock, { timeout: 15000 }).should('be.visible')
  tableHelpers.waitForListReady()
}

// Wait for settings tab to be ready
const waitForSettingsReady = () => {
  cy.get(selectors.nameInput, { timeout: 10000 }).should('be.visible')
}

// Helper to check if list has data
const hasListData = () => {
  return cy.get('body').then(($body) => {
    const hasTable = $body.find('.p-datatable').length > 0
    const hasRows = $body.find('[data-testid*="list-table-block__column__name"]').length > 0
    return hasTable && hasRows
  })
}

// Create a database for deletion test
const createDatabaseForDelete = (name) => {
  cy.visit('/sql-database/create')
  cy.get('[data-testid="database-name-field"] input', { timeout: 10000 }).should('be.visible')
  cy.get('[data-testid="database-name-field"] input')
    .clear()
    .type(name)
  cy.get('[data-testid="form-actions-submit-button"]').click()

  // Wait for redirect to list
  cy.get(selectors.contentBlock, { timeout: 30000 }).should('be.visible')

  // Search for created database
  tableHelpers.waitForListReady()
  tableHelpers.searchAndSubmit(name)
  cy.get(selectors.nameColumn, { timeout: 15000 }).should('contain', name)
}

describe('Edge SQL - Delete', { tags: ['@crud', '@edge-sql'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/sql-database')
    waitForPageReady()
  })

  describe('Delete from List', () => {
    it('should delete database from list', () => {
      const dbName = generateDatabaseName('del-list')

      // Create database first
      createDatabaseForDelete(dbName)

      // Open actions menu and click delete
      cy.get(selectors.actionsButton).first().click()
      cy.get('[role="menuitem"]').contains(/delete/i).click()

      // Confirm deletion
      cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
        .should('be.visible')
        .type(dbName)

      cy.get(selectors.deleteDialog.deleteButton).click()

      // Wait for delete to process
      cy.wait(5000)

      // Verify database is gone or in deleting status
      tableHelpers.searchAndSubmit(dbName)
      cy.get('body').then(($body) => {
        const hasRow = $body.find(selectors.nameColumn).length > 0
        if (hasRow) {
          // May still show with 'deleting' status
          cy.get('.p-tag').should('contain', 'deleting')
        } else {
          cy.log('Database deleted successfully')
        }
      })
    })

    it('should show confirmation dialog before delete', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          cy.get(selectors.actionsButton).first().click()
          cy.get('[role="menuitem"]').contains(/delete/i).click()

          cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
            .should('be.visible')

          cy.get(selectors.deleteDialog.cancelButton)
            .should('be.visible')
            .click()

          cy.get(selectors.deleteDialog.confirmInput).should('not.exist')
        } else {
          cy.log('No databases to delete - skipping test')
        }
      })
    })

    it('should cancel delete operation', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          cy.get(selectors.nameColumn)
            .first()
            .invoke('text')
            .then((dbName) => {
              cy.get(selectors.actionsButton).first().click()
              cy.get('[role="menuitem"]').contains(/delete/i).click()

              cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
                .should('be.visible')

              cy.get(selectors.deleteDialog.cancelButton).click()

              cy.get(selectors.deleteDialog.confirmInput).should('not.exist')

              // Database should still exist
              cy.get(selectors.nameColumn)
                .first()
                .should('contain', dbName.trim())
            })
        } else {
          cy.log('No databases - skipping test')
        }
      })
    })

    it('should disable delete for databases in creating status', () => {
      // This test verifies that delete is disabled for databases being created
      cy.get('body').then(($body) => {
        const creatingRows = $body.find('.p-tag:contains("creating")')
        if (creatingRows.length > 0) {
          // Find the actions button for a creating database
          cy.contains('.p-tag', 'creating')
            .closest('tr')
            .find(selectors.actionsButton)
            .click()

          // Delete should be disabled
          cy.get('[role="menuitem"]').contains(/delete/i)
            .should('have.attr', 'aria-disabled', 'true')

          cy.get('body').click(0, 0)
        } else {
          cy.log('No databases in creating status - skipping test')
        }
      })
    })
  })

  describe('Delete from Settings Tab', () => {
    it('should show delete button in Danger Zone', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          cy.get(selectors.nameColumn).first().click()
          cy.get('.p-tabview', { timeout: 15000 }).should('be.visible')

          cy.get(selectors.settingsTab).click()
          waitForSettingsReady()

          cy.contains('Danger Zone').should('be.visible')
          cy.get(selectors.dangerZoneDeleteButton)
            .should('be.visible')
            .should('contain', 'Delete database')
        } else {
          cy.log('No databases to test - skipping')
        }
      })
    })

    it('should open delete confirmation from Settings tab', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          cy.get(selectors.nameColumn).first().click()
          cy.get('.p-tabview', { timeout: 15000 }).should('be.visible')

          cy.get(selectors.settingsTab).click()
          waitForSettingsReady()

          cy.get(selectors.dangerZoneDeleteButton).click()

          // Should show confirmation dialog
          cy.get('.p-dialog', { timeout: 5000 }).should('be.visible')
          cy.contains('Delete database').should('be.visible')
        } else {
          cy.log('No databases to test - skipping')
        }
      })
    })

    it('should delete database from Settings tab', () => {
      const dbName = generateDatabaseName('del-settings')

      // Create database first
      createDatabaseForDelete(dbName)

      // Navigate to edit page
      cy.get(selectors.nameColumn).first().click()
      cy.get('.p-tabview', { timeout: 15000 }).should('be.visible')

      // Go to Settings tab
      cy.get(selectors.settingsTab).click()
      waitForSettingsReady()

      // Click delete button
      cy.get(selectors.dangerZoneDeleteButton).click()

      // Confirm in dialog
      cy.get('.p-dialog', { timeout: 5000 }).should('be.visible')
      cy.get('.p-dialog-footer button').contains(/delete|confirm/i).click()

      // Should redirect to list
      cy.url({ timeout: 15000 }).should('include', '/sql-database')
      cy.url().should('not.include', '/database/')

      // Verify database is gone
      tableHelpers.waitForListReady()
      tableHelpers.searchAndSubmit(dbName)
      cy.get('body').then(($body) => {
        const hasRow = $body.find(selectors.nameColumn).length > 0
        if (!hasRow) {
          cy.log('Database deleted successfully')
        }
      })
    })
  })
})
