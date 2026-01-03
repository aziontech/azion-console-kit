/**
 * Variables - Cache Invalidation Tests
 *
 * Tests that verify TanStack Query cache behavior:
 * - Cache is invalidated after create/update/delete mutations
 * - List is refreshed with new data after mutations
 *
 * Variables uses v3 API: /v3/variables
 */

import { cacheHelpers, tableHelpers } from '../../../support/console-kit-helpers'

const selectors = {
  createButton: '[data-testid="create_Variable_button"]',
  keyInput: '[data-testid="variables-form__key-field__input"]',
  valueInput: '[data-testid="variables-form__value-field__input"]',
  saveButton: '[data-testid="form-actions-submit-button"]',
  searchInput: '[data-testid="data-table-search-input"]',
  tableRow: '[data-testid*="list-table-block__column__key"]',
  actionsMenu: '[data-testid="data-table-actions-column-body-actions-menu-button"]'
}

describe('Variables - Cache Invalidation', { tags: ['@cache', '@variables', '@v3'] }, () => {
  const testKey = `CY_CACHE_TEST_${Date.now()}`
  const testValue = 'cache-test-value'

  beforeEach(() => {
    // Setup intercepts to track API calls
    cy.intercept('GET', '**/v3/variables*').as('listVariables')
    cy.intercept('POST', '**/v3/variables').as('createVariable')
    cy.intercept('PUT', '**/v3/variables/*').as('updateVariable')
    cy.intercept('DELETE', '**/v3/variables/*').as('deleteVariable')

    cy.login()
  })

  describe('Create Mutation Cache Invalidation', () => {
    it('should refresh list after creating a new variable', () => {
      // Navigate to list page
      cy.openProduct('Variables')
      cy.wait('@listVariables')
      tableHelpers.waitForListReady()

      // Create new variable
      cy.get(selectors.createButton).click()
      cy.get(selectors.keyInput, { timeout: 15000 }).clear().type(testKey)
      cy.get(selectors.valueInput).clear().type(testValue)
      cy.get(selectors.saveButton).click()

      // Wait for create mutation
      cy.wait('@createVariable').its('response.statusCode').should('be.oneOf', [200, 201, 202])

      // Verify success toast
      cy.get('.p-toast-message-success', { timeout: 10000 }).should('be.visible')

      // Navigate back to list
      cy.openProduct('Variables')

      // Cache should be invalidated - new request should be made
      cy.wait('@listVariables')

      // Verify new variable appears in list
      tableHelpers.searchAndSubmit(testKey)
      cy.get(selectors.tableRow).should('contain', testKey)
    })
  })

  describe('Update Mutation Cache Invalidation', () => {
    const updateTestKey = `CY_CACHE_UPDATE_${Date.now()}`
    const updatedValue = 'updated-cache-value'

    before(() => {
      // Create a variable to update
      cy.login()
      cy.openProduct('Variables')
      cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
      cy.get(selectors.createButton).click()
      cy.get(selectors.keyInput, { timeout: 15000 }).clear().type(updateTestKey)
      cy.get(selectors.valueInput).clear().type('original-value')
      cy.get(selectors.saveButton).click()
      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
    })

    it('should refresh data after updating a variable', () => {
      cy.openProduct('Variables')
      cy.wait('@listVariables')
      tableHelpers.waitForListReady()

      // Find and click on our test variable
      tableHelpers.searchAndSubmit(updateTestKey)
      cy.get(selectors.tableRow).contains(updateTestKey).click()

      // Wait for detail page to load
      cy.get(selectors.keyInput, { timeout: 15000 }).should('have.value', updateTestKey)

      // Update the value
      cy.get(selectors.valueInput).clear().type(updatedValue)
      cy.get(selectors.saveButton).click()

      // Wait for update mutation
      cy.wait('@updateVariable').its('response.statusCode').should('be.oneOf', [200, 202])

      // Verify success toast
      cy.get('.p-toast-message-success', { timeout: 10000 }).should('be.visible')

      // Navigate back to list
      cy.openProduct('Variables')
      cy.wait('@listVariables')

      // Verify variable still appears (key unchanged, value updated)
      tableHelpers.searchAndSubmit(updateTestKey)
      cy.get(selectors.tableRow).should('contain', updateTestKey)
    })
  })

  describe('Delete Mutation Cache Invalidation', () => {
    const deleteTestKey = `CY_CACHE_DELETE_${Date.now()}`

    before(() => {
      // Create a variable to delete
      cy.login()
      cy.openProduct('Variables')
      cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
      cy.get(selectors.createButton).click()
      cy.get(selectors.keyInput, { timeout: 15000 }).clear().type(deleteTestKey)
      cy.get(selectors.valueInput).clear().type('to-be-deleted')
      cy.get(selectors.saveButton).click()
      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
    })

    it('should refresh list after deleting a variable', () => {
      cy.openProduct('Variables')
      cy.wait('@listVariables')
      tableHelpers.waitForListReady()

      // Find our test variable
      tableHelpers.searchAndSubmit(deleteTestKey)
      cy.get(selectors.tableRow).should('contain', deleteTestKey)

      // Open actions menu and click delete
      cy.get(selectors.actionsMenu).first().click()
      cy.get('[role="menuitem"]').contains(/delete/i).click()

      // Confirm deletion (Variables may not require typed confirmation)
      cy.get('.p-dialog', { timeout: 10000 }).should('be.visible')
      cy.get('.p-dialog').find('button').contains(/delete|confirm/i).click()

      // Wait for delete mutation
      cy.wait('@deleteVariable').its('response.statusCode').should('be.oneOf', [200, 202, 204])

      // Verify success toast
      cy.get('.p-toast-message-success', { timeout: 10000 }).should('be.visible')

      // List should be refreshed automatically
      cy.wait('@listVariables')

      // Verify variable no longer appears
      tableHelpers.searchAndSubmit(deleteTestKey)
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 10000 }).should('exist')
    })
  })

  describe('Force Refresh Behavior', () => {
    it('should fetch fresh data after clearing IndexedDB cache', () => {
      cy.openProduct('Variables')
      cy.wait('@listVariables')
      tableHelpers.waitForListReady()

      // Force refresh clears IndexedDB and reloads
      cacheHelpers.forceRefresh()

      // Should make fresh request after reload
      cy.wait('@listVariables')
      tableHelpers.waitForListReady()
      cy.get(selectors.createButton).should('be.visible')
    })
  })
})
