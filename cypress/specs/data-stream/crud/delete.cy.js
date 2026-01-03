/**
 * Data Stream - Delete Tests (Self-Contained)
 *
 * API: DELETE v4/workspace/stream/streams/:id
 * Route: /data-stream
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/data-stream'

const generateStreamName = (prefix = 'Stream') => {
  return `${prefix}_${Date.now()}`
}

// Helper to create a stream
const createStream = (name) => {
  cy.get(selectors.createButton, { timeout: 15000 }).click()

  cy.get(selectors.nameInput, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(name)

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
    .type('https://webhook.site/delete-test')

  cy.get(selectors.formActions.saveButton).click()

  // Handle sampling dialog if it appears
  cy.get('body').then(($body) => {
    if ($body.find('.p-dialog-footer').length) {
      cy.get('.p-dialog-footer button').first().click()
    }
  })

  cy.get('.p-toast-message', { timeout: 30000 }).should('be.visible')
}

describe('Data Stream - Delete', { tags: ['@crud', '@data-stream', '@v4'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Data Stream')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
  })

  describe('Delete Stream', () => {
    it('should show delete action in row actions', () => {
      const streamName = generateStreamName('DeleteActionTest')

      createStream(streamName)

      // Go back to list
      cy.openProduct('Data Stream')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search for the stream
      tableHelpers.searchAndSubmit(streamName)

      // Check for action button
      cy.get('[data-testid*="actions"]', { timeout: 15000 }).should('exist')
    })

    it('should delete stream via single action button', () => {
      const streamName = generateStreamName('SingleDelete')

      createStream(streamName)

      // Go back to list
      cy.openProduct('Data Stream')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search for the stream
      tableHelpers.searchAndSubmit(streamName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', streamName)

      // Try single action button first
      cy.get('body').then(($body) => {
        if ($body.find(selectors.actions.singleActionButton).length) {
          cy.get(selectors.actions.singleActionButton).first().click()
        } else if ($body.find(selectors.actions.menuButton).length) {
          cy.get(selectors.actions.menuButton).first().click()
          cy.get('.p-menuitem-link').contains(/delete/i).click()
        }
      })

      // Confirm deletion - use stream name for confirmation
      cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
        .should('be.visible')
        .type(streamName)

      cy.get(selectors.deleteDialog.deleteButton).click()

      // Verify deletion success
      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')
        .and('contain', 'deleted')
    })

    it('should cancel delete operation', () => {
      const streamName = generateStreamName('CancelDelete')

      createStream(streamName)

      // Go back to list
      cy.openProduct('Data Stream')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search for the stream
      tableHelpers.searchAndSubmit(streamName)

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

      // Verify stream still exists
      tableHelpers.searchAndSubmit(streamName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', streamName)
    })

    it('should require correct stream name for confirmation', () => {
      const streamName = generateStreamName('WrongConfirm')

      createStream(streamName)

      // Go back to list
      cy.openProduct('Data Stream')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search for the stream
      tableHelpers.searchAndSubmit(streamName)

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

    it('should remove stream from list after successful deletion', () => {
      const streamName = generateStreamName('RemoveFromList')

      createStream(streamName)

      // Go back to list
      cy.openProduct('Data Stream')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search and verify stream exists
      tableHelpers.searchAndSubmit(streamName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', streamName)

      // Delete the stream
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
        .type(streamName)

      cy.get(selectors.deleteDialog.deleteButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

      // Verify stream is no longer in list
      tableHelpers.searchAndSubmit(streamName)
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 10000 })
        .should('exist')
    })
  })
})
