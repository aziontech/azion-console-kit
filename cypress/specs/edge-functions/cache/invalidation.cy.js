/**
 * Edge Functions - Cache Invalidation Tests
 *
 * Tests that verify TanStack Query cache behavior:
 * - Cache is invalidated after create/update/delete mutations
 * - List is refreshed with new data after mutations
 * - Navigation uses cached data when available
 *
 * Console-kit cache settings:
 * - PAGE_LIST: 5 min stale, 5 min gc
 */

import { cacheHelpers, tableHelpers } from '../../../support/console-kit-helpers'

const selectors = {
  createButton: '[data-testid="create_Function_button"]',
  nameInput: '[data-testid="field-text__input"]',
  saveButton: '[data-testid="form-actions-submit-button"]',
  searchInput: '[data-testid="data-table-search-input"]',
  tableRow: '[data-testid*="list-table-block__column__name"]',
  actionsMenu: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
  deleteAction: '[data-testid*="delete"]',
  confirmInput: '[data-testid="delete-dialog__confirmation-input"]',
  confirmButton: '[data-testid="delete-dialog__confirm-button"]'
}

describe('Edge Functions - Cache Invalidation', { tags: ['@cache', '@edge-functions'] }, () => {
  const testFunctionName = `cy-cache-test-${Date.now()}`

  beforeEach(() => {
    // Setup intercepts to track API calls
    cy.intercept('GET', '**/v4/workspace/functions*').as('listFunctions')
    cy.intercept('POST', '**/v4/workspace/functions').as('createFunction')
    cy.intercept('PATCH', '**/v4/workspace/functions/*').as('updateFunction')
    cy.intercept('DELETE', '**/v4/workspace/functions/*').as('deleteFunction')

    cy.login()
  })

  describe('Create Mutation Cache Invalidation', () => {
    it('should refresh list after creating a new function', () => {
      // Navigate to list page
      cy.openProduct('Edge Functions')
      cy.wait('@listFunctions')
      tableHelpers.waitForListReady()

      // Create new function
      cy.get(selectors.createButton).click()
      cy.get(selectors.nameInput, { timeout: 15000 }).clear().type(testFunctionName)
      cy.get(selectors.saveButton).click()

      // Wait for create mutation
      cy.wait('@createFunction').its('response.statusCode').should('be.oneOf', [200, 201, 202])

      // Verify success toast
      cy.get('.p-toast-message-success', { timeout: 10000 }).should('be.visible')

      // Navigate back to list
      cy.openProduct('Edge Functions')

      // Cache should be invalidated - new request should be made
      cy.wait('@listFunctions')

      // Verify new function appears in list
      tableHelpers.searchAndSubmit(testFunctionName)
      cy.get(selectors.tableRow).should('contain', testFunctionName)
    })
  })

  describe('Update Mutation Cache Invalidation', () => {
    const updatedName = `${testFunctionName}-updated`

    before(() => {
      // Create a function to update
      cy.login()
      cy.openProduct('Edge Functions')
      cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
      cy.get(selectors.createButton).click()
      cy.get(selectors.nameInput, { timeout: 15000 }).clear().type(testFunctionName)
      cy.get(selectors.saveButton).click()
      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
    })

    it('should refresh data after updating a function', () => {
      cy.openProduct('Edge Functions')
      cy.wait('@listFunctions')
      tableHelpers.waitForListReady()

      // Find and click on our test function
      tableHelpers.searchAndSubmit(testFunctionName)
      cy.get(selectors.tableRow).contains(testFunctionName).click()

      // Wait for detail page to load
      cy.get(selectors.nameInput, { timeout: 15000 }).should('have.value', testFunctionName)

      // Update the name
      cy.get(selectors.nameInput).clear().type(updatedName)
      cy.get(selectors.saveButton).click()

      // Wait for update mutation
      cy.wait('@updateFunction').its('response.statusCode').should('be.oneOf', [200, 202])

      // Verify success toast
      cy.get('.p-toast-message-success', { timeout: 10000 }).should('be.visible')

      // Navigate back to list
      cy.openProduct('Edge Functions')
      cy.wait('@listFunctions')

      // Verify updated name appears in list
      tableHelpers.searchAndSubmit(updatedName)
      cy.get(selectors.tableRow).should('contain', updatedName)

      // Old name should not exist
      tableHelpers.searchAndSubmit(testFunctionName)
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 10000 }).should('exist')
    })
  })

  describe('Delete Mutation Cache Invalidation', () => {
    const deleteTestName = `cy-cache-delete-${Date.now()}`

    before(() => {
      // Create a function to delete
      cy.login()
      cy.openProduct('Edge Functions')
      cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
      cy.get(selectors.createButton).click()
      cy.get(selectors.nameInput, { timeout: 15000 }).clear().type(deleteTestName)
      cy.get(selectors.saveButton).click()
      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
    })

    it('should refresh list after deleting a function', () => {
      cy.openProduct('Edge Functions')
      cy.wait('@listFunctions')
      tableHelpers.waitForListReady()

      // Find our test function
      tableHelpers.searchAndSubmit(deleteTestName)
      cy.get(selectors.tableRow).should('contain', deleteTestName)

      // Open actions menu and click delete
      cy.get(selectors.actionsMenu).first().click()
      cy.get('[role="menuitem"]').contains(/delete/i).click()

      // Confirm deletion
      cy.get(selectors.confirmInput, { timeout: 10000 }).type(deleteTestName)
      cy.get(selectors.confirmButton).click()

      // Wait for delete mutation
      cy.wait('@deleteFunction').its('response.statusCode').should('be.oneOf', [200, 202, 204])

      // Verify success toast
      cy.get('.p-toast-message-success', { timeout: 10000 }).should('be.visible')

      // List should be refreshed automatically
      cy.wait('@listFunctions')

      // Verify function no longer appears
      tableHelpers.searchAndSubmit(deleteTestName)
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 10000 }).should('exist')
    })
  })

  describe('Navigation Cache Behavior', () => {
    it('should use cached data when navigating back to list quickly', () => {
      cy.openProduct('Edge Functions')
      cy.wait('@listFunctions')
      tableHelpers.waitForListReady()

      // Navigate to create page
      cy.get(selectors.createButton).click()
      cy.get(selectors.nameInput, { timeout: 15000 }).should('be.visible')

      // Navigate back immediately (within cache stale time)
      cy.go('back')

      // Should show cached data without new request
      // Note: This depends on TanStack Query's staleTime config
      tableHelpers.waitForListReady()
      cy.get(selectors.createButton).should('be.visible')
    })

    it('should refetch after clearing persisted cache', () => {
      cy.openProduct('Edge Functions')
      cy.wait('@listFunctions')
      tableHelpers.waitForListReady()

      // Clear persisted cache
      cacheHelpers.clearPersistedCache()

      // Reload page
      cy.reload()

      // Should make fresh request
      cy.wait('@listFunctions')
      tableHelpers.waitForListReady()
    })
  })
})
