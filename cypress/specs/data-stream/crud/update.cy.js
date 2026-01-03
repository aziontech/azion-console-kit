/**
 * Data Stream - Update Tests (Self-Contained)
 *
 * API: PATCH v4/workspace/stream/streams/:id
 * Route: /data-stream/edit/:id
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/data-stream'

const generateStreamName = (prefix = 'Stream') => {
  return `${prefix}_${Date.now()}`
}

describe('Data Stream - Update', { tags: ['@crud', '@data-stream', '@v4'] }, () => {
  let testStreamName

  before(() => {
    // Create a stream to use for update tests
    testStreamName = generateStreamName('UpdateTest')

    cy.login()
    cy.openProduct('Data Stream')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

    cy.get(selectors.createButton, { timeout: 15000 }).click()

    cy.get(selectors.nameInput, { timeout: 15000 })
      .should('be.visible')
      .clear()
      .type(testStreamName)

    // Select data source
    cy.get(selectors.sourceDropdown, { timeout: 10000 }).click()
    cy.get('.p-dropdown-items .p-dropdown-item', { timeout: 5000 })
      .first()
      .click()

    // Select template
    cy.get(selectors.templateDropdown, { timeout: 10000 }).click()
    cy.get('.p-dropdown-items .p-dropdown-item', { timeout: 5000 })
      .first()
      .click()

    // Fill URL
    cy.get(selectors.httpConnector.urlInput, { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type('https://webhook.site/update-test')

    cy.get(selectors.formActions.saveButton).click()

    // Handle sampling dialog if it appears
    cy.get('body').then(($body) => {
      if ($body.find('.p-dialog-footer').length) {
        cy.get('.p-dialog-footer button').first().click()
      }
    })

    cy.get('.p-toast-message', { timeout: 30000 }).should('be.visible')
  })

  beforeEach(() => {
    cy.login()
    cy.openProduct('Data Stream')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
  })

  describe('Stream Update', () => {
    it('should navigate to edit page for existing stream', () => {
      tableHelpers.searchAndSubmit(testStreamName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testStreamName)
        .click()

      cy.url({ timeout: 15000 }).should('include', '/data-stream/edit/')
      cy.get(selectors.nameInput, { timeout: 15000 }).should('be.visible')
    })

    it('should load stream data in edit form', () => {
      tableHelpers.searchAndSubmit(testStreamName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testStreamName)
        .click()

      cy.get(selectors.nameInput, { timeout: 15000 })
        .should('have.value', testStreamName)
    })

    it('should update stream name', () => {
      const newName = `${testStreamName}_Updated`

      tableHelpers.searchAndSubmit(testStreamName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testStreamName)
        .click()

      cy.get(selectors.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(newName)

      cy.get(selectors.formActions.saveButton).click()

      // Handle sampling dialog if it appears
      cy.get('body').then(($body) => {
        if ($body.find('.p-dialog-footer').length) {
          cy.get('.p-dialog-footer button').first().click()
        }
      })

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')

      // Update test stream name for subsequent tests
      testStreamName = newName
    })

    it('should update endpoint URL', () => {
      tableHelpers.searchAndSubmit(testStreamName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testStreamName)
        .click()

      cy.get(selectors.httpConnector.urlInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type('https://webhook.site/updated-endpoint')

      cy.get(selectors.formActions.saveButton).click()

      // Handle sampling dialog if it appears
      cy.get('body').then(($body) => {
        if ($body.find('.p-dialog-footer').length) {
          cy.get('.p-dialog-footer button').first().click()
        }
      })

      cy.get('.p-toast-message', { timeout: 30000 }).should('be.visible')
    })
  })

  describe('Validation on Update', () => {
    it('should show error when clearing required name field', () => {
      tableHelpers.searchAndSubmit(testStreamName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testStreamName)
        .click()

      cy.get(selectors.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .blur()

      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-error, [data-testid*="error"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Cancel Update', () => {
    it('should discard changes on cancel', () => {
      const originalName = testStreamName

      tableHelpers.searchAndSubmit(testStreamName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testStreamName)
        .click()

      cy.get(selectors.nameInput, { timeout: 15000 })
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

      // Verify original stream still exists
      tableHelpers.searchAndSubmit(originalName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', originalName)
    })
  })
})
