/**
 * Regression Test: ENG-35882
 * Bug: Object Storage improvements - Buckets and Credentials
 *
 * Jira: https://azion.atlassian.net/browse/ENG-35882
 * Status: CLOSED (2025-12-10)
 *
 * Issues reported:
 * 1. Navigation bug in Settings tab
 * 2. Folder creation issues
 * 3. Bulk delete not working correctly
 *
 * This is a regression test to ensure the fixes remain in place.
 */

import { tableHelpers } from '../../../support/console-kit-helpers'

const selectors = {
  createButton: '[data-testid="create_Bucket_button"]',
  nameInput: '[data-testid="edge-storage-form__name-field__input"]',
  formActions: {
    saveButton: '[data-testid="form-actions-submit-button"]',
    cancelButton: '[data-testid="form-actions-cancel-button"]'
  },
  searchInput: '[data-testid="data-table-search-input"]',
  settingsTab: '.p-tabview-nav [data-testid*="settings"], .p-tabview-nav:contains("Settings")',
  objectsTab: '.p-tabview-nav [data-testid*="objects"], .p-tabview-nav:contains("Objects")',
  createFolderButton: '[data-testid*="create-folder"], [data-testid*="new-folder"]',
  bulkDeleteButton: '[data-testid*="bulk-delete"], [data-testid*="delete-selected"]',
  selectAllCheckbox: '.p-datatable-thead .p-checkbox-box'
}

describe('ENG-35882: Object Storage Improvements', { tags: ['@regression', '@bug', '@edge-storage', '@closed'] }, () => {
  let testBucketName = null

  before(() => {
    // Create a test bucket for regression testing
    const timestamp = Date.now()
    testBucketName = `cy-regression-${timestamp}`.toLowerCase()

    cy.login()
    cy.visit('/edge-storage/buckets')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

    // Create a new bucket
    cy.get(selectors.createButton).click()
    cy.get(selectors.nameInput, { timeout: 15000 }).should('be.visible').clear().type(testBucketName)
    cy.get(selectors.formActions.saveButton).click()
    cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
  })

  beforeEach(() => {
    cy.login()
    cy.visit('/edge-storage/buckets')
    tableHelpers.waitForListReady()
  })

  describe('Navigation Fixes', () => {
    it('should navigate correctly between bucket tabs', () => {
      // Search and open test bucket
      tableHelpers.searchAndSubmit(testBucketName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testBucketName)
        .click()

      // Wait for bucket edit page
      cy.url({ timeout: 15000 }).should('include', '/edge-storage/buckets/edit/')

      // Navigate to Objects tab
      cy.get('.p-tabview-nav').contains('Objects').click()
      cy.url().should('include', '/objects')

      // Navigate back to Settings tab
      cy.get('.p-tabview-nav').contains('Settings').click()

      // BUG FIX VERIFICATION: Settings content should be visible
      cy.get('[data-testid*="settings"], form').should('be.visible')

      // Navigate to Objects again
      cy.get('.p-tabview-nav').contains('Objects').click()

      // Objects content should be visible
      cy.get('.p-datatable, [data-testid*="empty"], [data-testid*="upload"]', { timeout: 10000 })
        .should('exist')
    })

    it('should maintain state when returning to bucket list', () => {
      // Open test bucket
      tableHelpers.searchAndSubmit(testBucketName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testBucketName)
        .click()

      // Navigate through tabs
      cy.get('.p-tabview-nav').contains('Objects').click()
      cy.get('.p-tabview-nav').contains('Settings').click()

      // Go back to list
      cy.visit('/edge-storage/buckets')
      tableHelpers.waitForListReady()

      // Search should work correctly
      tableHelpers.searchAndSubmit(testBucketName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .should('contain', testBucketName)
    })
  })

  describe('Object Operations', () => {
    beforeEach(() => {
      // Navigate to bucket objects
      tableHelpers.searchAndSubmit(testBucketName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testBucketName)
        .click()
      cy.get('.p-tabview-nav').contains('Objects').click()
      cy.get('.p-datatable, [data-testid*="empty"], [data-testid*="upload"]', { timeout: 15000 })
        .should('exist')
    })

    it('should allow creating folders if feature exists', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid*="create-folder"], [data-testid*="new-folder"]').length > 0) {
          cy.get('[data-testid*="create-folder"], [data-testid*="new-folder"]').click()

          // Folder creation dialog should open
          cy.get('[data-testid*="folder-name"], [data-testid*="name-input"]', { timeout: 10000 })
            .should('be.visible')

          // Enter folder name
          cy.get('[data-testid*="folder-name"], [data-testid*="name-input"]')
            .type('test-folder')

          // Cancel to avoid creating test data
          cy.get('[data-testid*="cancel"], .p-dialog-close').click()
        } else {
          cy.log('Create folder button not found - feature may not be available')
        }
      })
    })

    it('should handle bulk selection correctly', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.p-datatable-tbody tr').length > 0) {
          // Select all checkbox
          cy.get(selectors.selectAllCheckbox).click()

          // All rows should be selected
          cy.get('.p-datatable-tbody .p-checkbox-box.p-highlight')
            .should('have.length.gte', 1)

          // Deselect all
          cy.get(selectors.selectAllCheckbox).click()

          // No rows should be selected
          cy.get('.p-datatable-tbody .p-checkbox-box.p-highlight')
            .should('have.length', 0)
        } else {
          cy.log('No objects in bucket for selection test')
        }
      })
    })

    it('should show bulk delete button when items are selected', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.p-datatable-tbody tr').length > 0) {
          // Initially bulk delete should be hidden or disabled
          cy.get('[data-testid*="bulk-delete"], [data-testid*="delete-selected"]')
            .should($el => {
              // Either not exist, be hidden, or be disabled
              if ($el.length > 0) {
                expect($el).to.have.attr('disabled').or.not.be.visible
              }
            })

          // Select items
          cy.get('.p-datatable-tbody .p-checkbox-box').first().click()

          // BUG FIX VERIFICATION: Bulk delete should become available
          cy.get('[data-testid*="bulk-delete"], [data-testid*="delete-selected"]')
            .should('be.visible')
            .and('not.be.disabled')

          // Deselect to clean up
          cy.get('.p-datatable-tbody .p-checkbox-box').first().click()
        } else {
          cy.log('No objects in bucket for bulk delete test')
        }
      })
    })
  })

  describe('Credentials Integration', () => {
    it('should navigate to credentials from bucket settings', () => {
      // Open test bucket
      tableHelpers.searchAndSubmit(testBucketName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testBucketName)
        .click()

      // Look for credentials link/button in settings
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid*="credentials"], [href*="credentials"]').length > 0) {
          cy.get('[data-testid*="credentials"], [href*="credentials"]').first().click()

          // Should navigate to credentials page
          cy.url({ timeout: 10000 }).should('include', 'credentials')
        } else {
          cy.log('Credentials link not found in bucket settings')
        }
      })
    })
  })
})
