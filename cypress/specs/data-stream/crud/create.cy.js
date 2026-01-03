/**
 * Data Stream - Create Tests (Self-Contained)
 *
 * API: POST v4/workspace/stream/streams
 * Route: /data-stream/create
 *
 * Stream requires: name, dataSource, template, connector
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/data-stream'

const generateStreamName = (prefix = 'Stream') => {
  return `${prefix}_${Date.now()}`
}

describe('Data Stream - Create', { tags: ['@crud', '@data-stream', '@v4'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Data Stream')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
  })

  describe('Stream Creation', () => {
    it('should navigate to create stream page', () => {
      cy.get(selectors.createButton, { timeout: 15000 })
        .should('be.visible')
        .click()

      cy.url().should('include', '/data-stream/create')
      cy.get(selectors.nameInput, { timeout: 15000 }).should('be.visible')
    })

    it('should display all form sections', () => {
      cy.get(selectors.createButton, { timeout: 15000 }).click()

      // General section
      cy.get(selectors.nameInput, { timeout: 15000 }).should('be.visible')

      // Data Settings section
      cy.get(selectors.sourceDropdown, { timeout: 10000 }).should('exist')
      cy.get(selectors.templateDropdown, { timeout: 10000 }).should('exist')

      // Connector section
      cy.get(selectors.connectorDropdown, { timeout: 10000 }).should('exist')
    })

    it('should create a stream with Standard HTTP/HTTPS connector', () => {
      const streamName = generateStreamName('HTTPStream')

      cy.get(selectors.createButton, { timeout: 15000 }).click()

      // Fill name
      cy.get(selectors.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(streamName)

      // Data Source should be pre-selected or select Edge Applications
      cy.get(selectors.sourceDropdown, { timeout: 10000 }).click()
      cy.get('.p-dropdown-items .p-dropdown-item', { timeout: 5000 })
        .first()
        .click()

      // Select template
      cy.get(selectors.templateDropdown, { timeout: 10000 }).click()
      cy.get('.p-dropdown-items .p-dropdown-item', { timeout: 5000 })
        .first()
        .click()

      // Connector should default to Standard HTTP/HTTPS
      // Fill URL
      cy.get(selectors.httpConnector.urlInput, { timeout: 10000 })
        .should('be.visible')
        .clear()
        .type('https://webhook.site/test-endpoint')

      // Submit
      cy.get(selectors.formActions.saveButton).click()

      // May trigger sampling dialog
      cy.get('body').then(($body) => {
        if ($body.find('.p-dialog-footer').length) {
          cy.get('.p-dialog-footer button').first().click()
        }
      })

      // Verify success
      cy.get('.p-toast-message', { timeout: 30000 }).should('be.visible')
    })

    it('should verify created stream appears in list', () => {
      const streamName = generateStreamName('ListCheck')

      cy.get(selectors.createButton, { timeout: 15000 }).click()

      cy.get(selectors.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(streamName)

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
        .type('https://webhook.site/test-endpoint')

      cy.get(selectors.formActions.saveButton).click()

      // Handle sampling dialog if it appears
      cy.get('body').then(($body) => {
        if ($body.find('.p-dialog-footer').length) {
          cy.get('.p-dialog-footer button').first().click()
        }
      })

      cy.get('.p-toast-message', { timeout: 30000 }).should('be.visible')

      // Navigate back to list
      cy.openProduct('Data Stream')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search for created stream
      tableHelpers.searchAndSubmit(streamName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', streamName)
    })
  })

  describe('Connector Types', () => {
    it('should show Kafka connector fields', () => {
      cy.get(selectors.createButton, { timeout: 15000 }).click()

      cy.get(selectors.nameInput, { timeout: 15000 }).type('KafkaTest')

      // Select Kafka connector
      cy.get(selectors.connectorDropdown, { timeout: 10000 }).click()
      cy.contains('.p-dropdown-item', /kafka/i, { timeout: 5000 }).click()

      // Verify Kafka-specific fields appear
      cy.get(selectors.kafkaConnector.serverTextarea, { timeout: 10000 }).should('be.visible')
      cy.get(selectors.kafkaConnector.topicInput, { timeout: 10000 }).should('be.visible')
    })

    it('should show S3 connector fields', () => {
      cy.get(selectors.createButton, { timeout: 15000 }).click()

      cy.get(selectors.nameInput, { timeout: 15000 }).type('S3Test')

      // Select S3 connector
      cy.get(selectors.connectorDropdown, { timeout: 10000 }).click()
      cy.contains('.p-dropdown-item', /s3/i, { timeout: 5000 }).click()

      // Verify S3-specific fields appear
      cy.get(selectors.s3Connector.urlInput, { timeout: 10000 }).should('be.visible')
      cy.get(selectors.s3Connector.bucketInput, { timeout: 10000 }).should('be.visible')
      cy.get(selectors.s3Connector.regionInput, { timeout: 10000 }).should('be.visible')
    })

    it('should show Splunk connector fields', () => {
      cy.get(selectors.createButton, { timeout: 15000 }).click()

      cy.get(selectors.nameInput, { timeout: 15000 }).type('SplunkTest')

      // Select Splunk connector
      cy.get(selectors.connectorDropdown, { timeout: 10000 }).click()
      cy.contains('.p-dropdown-item', /splunk/i, { timeout: 5000 }).click()

      // Verify Splunk-specific fields appear
      cy.get(selectors.splunkConnector.urlInput, { timeout: 10000 }).should('be.visible')
      cy.get(selectors.splunkConnector.apiKeyTextarea, { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Validation', () => {
    it('should show error for empty name', () => {
      cy.get(selectors.createButton, { timeout: 15000 }).click()

      cy.get(selectors.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .blur()

      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-error, [data-testid*="error"]', { timeout: 10000 })
        .should('exist')
    })

    it('should show error for invalid URL format', () => {
      cy.get(selectors.createButton, { timeout: 15000 }).click()

      cy.get(selectors.nameInput, { timeout: 15000 })
        .should('be.visible')
        .type('ValidationTest')

      // Select data source and template
      cy.get(selectors.sourceDropdown, { timeout: 10000 }).click()
      cy.get('.p-dropdown-items .p-dropdown-item', { timeout: 5000 })
        .first()
        .click()

      cy.get(selectors.templateDropdown, { timeout: 10000 }).click()
      cy.get('.p-dropdown-items .p-dropdown-item', { timeout: 5000 })
        .first()
        .click()

      // Fill invalid URL
      cy.get(selectors.httpConnector.urlInput, { timeout: 10000 })
        .should('be.visible')
        .clear()
        .type('not-a-valid-url')
        .blur()

      cy.get(selectors.formActions.saveButton).click()

      // Should show error or stay on create page
      cy.get('body').then(($body) => {
        if ($body.find('.p-error, [data-testid*="error"]').length) {
          cy.get('.p-error, [data-testid*="error"]').should('be.visible')
        } else {
          cy.url().should('include', '/data-stream/create')
        }
      })
    })
  })

  describe('Form Actions', () => {
    it('should cancel creation and return to list', () => {
      cy.get(selectors.createButton, { timeout: 15000 }).click()

      cy.get(selectors.nameInput, { timeout: 15000 })
        .should('be.visible')
        .type('WillBeCancelled')

      cy.get(selectors.formActions.cancelButton).click()

      // Handle potential confirmation dialog
      cy.get('body').then(($body) => {
        if ($body.find('.p-dialog-footer button').length) {
          cy.get('.p-dialog-footer button').contains(/leave|discard|confirm/i).click()
        }
      })

      cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
    })
  })
})
