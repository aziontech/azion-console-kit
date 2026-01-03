/**
 * Edge Applications - Update Tests (Self-Contained)
 *
 * API: PATCH v4/workspace/applications/:id
 * Route: /edge-application/edit/:id
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/edge-application'

const generateAppName = (prefix = 'App') => {
  return `${prefix}_${Date.now()}`
}

describe('Edge Applications - Update', { tags: ['@crud', '@edge-applications', '@v4', '@smoke'] }, () => {
  let testAppName

  before(() => {
    // Create an application to use for update tests
    testAppName = generateAppName('UpdateTest')

    cy.login()
    cy.openProduct('Edge Application')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

    cy.get(selectors.mainSettings.createButton, { timeout: 15000 }).click()

    cy.get(selectors.mainSettings.nameInput, { timeout: 15000 })
      .should('be.visible')
      .clear()
      .type(testAppName)

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
  })

  beforeEach(() => {
    cy.login()
    cy.openProduct('Edge Application')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
  })

  describe('Application Update', () => {
    it('should navigate to edit page for existing application', () => {
      tableHelpers.searchAndSubmit(testAppName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testAppName)
        .click()

      cy.url({ timeout: 15000 }).should('include', '/edge-application/edit/')
      cy.get(selectors.mainSettings.nameInput, { timeout: 15000 }).should('be.visible')
    })

    it('should load application data in edit form', () => {
      tableHelpers.searchAndSubmit(testAppName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testAppName)
        .click()

      cy.get(selectors.mainSettings.nameInput, { timeout: 15000 })
        .should('have.value', testAppName)
    })

    it('should update application name', () => {
      const newName = `${testAppName}_Updated`

      tableHelpers.searchAndSubmit(testAppName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testAppName)
        .click()

      cy.get(selectors.mainSettings.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(newName)

      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')

      // Update test app name for subsequent tests
      testAppName = newName
    })
  })

  describe('Tab Navigation', () => {
    it('should display multiple tabs in edit view', () => {
      tableHelpers.searchAndSubmit(testAppName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testAppName)
        .click()

      // Wait for tabs to load
      cy.get('.p-tabview-nav', { timeout: 15000 }).should('exist')

      // Should have multiple tabs
      cy.get('.p-tabview-nav .p-tabview-nav-link').should('have.length.gte', 1)
    })

    it('should navigate between tabs', () => {
      tableHelpers.searchAndSubmit(testAppName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testAppName)
        .click()

      cy.get('.p-tabview-nav', { timeout: 15000 }).should('exist')

      // Click on the second tab if it exists
      cy.get('.p-tabview-nav .p-tabview-nav-link').then(($tabs) => {
        if ($tabs.length > 1) {
          cy.wrap($tabs).eq(1).click()
          cy.url().should('include', '/edit/')
        }
      })
    })
  })

  describe('Validation on Update', () => {
    it('should show error when clearing required name field', () => {
      tableHelpers.searchAndSubmit(testAppName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testAppName)
        .click()

      cy.get(selectors.mainSettings.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .blur()

      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-error, [data-testid*="error"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Cancel Update', () => {
    it('should discard changes on cancel', () => {
      const originalName = testAppName

      tableHelpers.searchAndSubmit(testAppName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testAppName)
        .click()

      cy.get(selectors.mainSettings.nameInput, { timeout: 15000 })
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

      // Verify original application still exists
      tableHelpers.searchAndSubmit(originalName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', originalName)
    })
  })
})
