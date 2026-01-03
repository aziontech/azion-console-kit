/**
 * Edge Storage - Delete Tests
 *
 * API: DELETE v4/workspace/storage/{name}
 * Route: /object-storage
 *
 * Note: Delete can be done from:
 * 1. List page via actions menu
 * 2. Edit page via Danger Zone button
 */

import { tableHelpers } from '../../../support/console-kit-helpers'

const selectors = {
  createButton: '[data-testid="create_Bucket_button"]',
  nameColumn: '[data-testid*="list-table-block__column__name"]',
  actionsButton: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
  nameInput: '[data-testid="edge-storage-form__name-field"] input',
  deleteButton: '[data-testid="account-settings__delete-account"]',
  deleteDialog: {
    confirmInput: '[data-testid="delete-dialog-confirmation-input-field"]',
    deleteButton: '[data-testid="delete-dialog-footer-delete-button"]',
    cancelButton: '[data-testid="delete-dialog-footer-cancel-button"]'
  }
}

const generateBucketName = (prefix = 'del') => {
  return `${prefix}-${Date.now()}`
}

// Wait for page to be ready
const waitForPageReady = () => {
  tableHelpers.waitForListReady()
}

// Helper to check if list has data
const hasListData = () => {
  return cy.get('body').then(($body) => {
    const hasTable = $body.find('.p-datatable').length > 0
    const hasRows = $body.find('[data-testid*="list-table-block__column__name"]').length > 0
    return hasTable && hasRows
  })
}

// Create a bucket for deletion test
const createBucketForDelete = (name) => {
  cy.visit('/object-storage/create')
  cy.get('[data-testid="edge-storage-form__name-field"] input', { timeout: 10000 }).should('be.visible')
  cy.get('[data-testid="edge-storage-form__name-field"] input')
    .clear()
    .type(name)
  cy.get('[data-testid="form-actions-submit-button"]').click()

  // Wait for success toast and redirect
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

  // Wait for list to load
  tableHelpers.waitForListReady()
  tableHelpers.searchAndSubmit(name)
  cy.get(selectors.nameColumn, { timeout: 15000 }).should('contain', name)
}

describe('Edge Storage - Delete', { tags: ['@crud', '@edge-storage'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/object-storage')
    waitForPageReady()
  })

  describe('Delete from List', () => {
    it('should delete bucket from list', () => {
      const bucketName = generateBucketName('del-list')

      // Create bucket first
      createBucketForDelete(bucketName)

      // Open actions menu and click delete
      cy.get(selectors.actionsButton).first().click()
      cy.get('[role="menuitem"]').contains(/delete/i).click()

      // Confirm deletion
      cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
        .should('be.visible')
        .type(bucketName)

      cy.get(selectors.deleteDialog.deleteButton).click()

      // Should show success toast
      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')

      // Verify bucket is gone
      tableHelpers.waitForListReady()
      tableHelpers.searchAndSubmit(bucketName)
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 15000 })
        .should('exist')
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
          cy.log('No buckets to delete - skipping test')
        }
      })
    })

    it('should cancel delete operation', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          cy.get(selectors.nameColumn)
            .first()
            .invoke('text')
            .then((bucketName) => {
              cy.get(selectors.actionsButton).first().click()
              cy.get('[role="menuitem"]').contains(/delete/i).click()

              cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
                .should('be.visible')

              cy.get(selectors.deleteDialog.cancelButton).click()

              cy.get(selectors.deleteDialog.confirmInput).should('not.exist')

              // Bucket should still exist
              cy.get(selectors.nameColumn)
                .first()
                .should('contain', bucketName.trim())
            })
        } else {
          cy.log('No buckets - skipping test')
        }
      })
    })
  })

  describe('Delete from Edit Page', () => {
    it('should show delete button in Danger Zone', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          // Navigate to edit page
          cy.get(selectors.actionsButton).first().click()
          cy.get('[role="menuitem"]').contains(/edit/i).click()

          cy.get('.p-tabview', { timeout: 15000 }).should('be.visible')
          cy.get(selectors.nameInput, { timeout: 10000 }).should('be.visible')

          cy.contains('Danger Zone').should('be.visible')
          cy.get(selectors.deleteButton)
            .should('be.visible')
            .should('contain', 'Delete Bucket')
        } else {
          cy.log('No buckets to test - skipping')
        }
      })
    })

    it('should open delete confirmation from edit page', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          // Navigate to edit page
          cy.get(selectors.actionsButton).first().click()
          cy.get('[role="menuitem"]').contains(/edit/i).click()

          cy.get('.p-tabview', { timeout: 15000 }).should('be.visible')
          cy.get(selectors.nameInput, { timeout: 10000 }).should('be.visible')

          cy.get(selectors.deleteButton).click()

          // Should show confirmation dialog
          cy.get(selectors.deleteDialog.confirmInput, { timeout: 5000 })
            .should('be.visible')

          // Cancel
          cy.get(selectors.deleteDialog.cancelButton).click()
        } else {
          cy.log('No buckets to test - skipping')
        }
      })
    })

    it('should delete bucket from edit page', () => {
      const bucketName = generateBucketName('del-edit')

      // Create bucket first
      createBucketForDelete(bucketName)

      // Navigate to edit page
      cy.get(selectors.actionsButton).first().click()
      cy.get('[role="menuitem"]').contains(/edit/i).click()

      cy.get('.p-tabview', { timeout: 15000 }).should('be.visible')
      cy.get(selectors.nameInput, { timeout: 10000 }).should('be.visible')

      // Click delete button
      cy.get(selectors.deleteButton).click()

      // Confirm in dialog
      cy.get(selectors.deleteDialog.confirmInput, { timeout: 5000 })
        .should('be.visible')
        .type(bucketName)

      cy.get(selectors.deleteDialog.deleteButton).click()

      // Should show success toast
      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')

      // Should redirect to list
      cy.url({ timeout: 15000 }).should('include', '/object-storage')
      cy.url().should('not.include', '/edit')

      // Verify bucket is gone
      tableHelpers.waitForListReady()
      tableHelpers.searchAndSubmit(bucketName)
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 15000 })
        .should('exist')
    })
  })
})
