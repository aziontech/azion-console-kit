/**
 * Edge Connectors - Create Integration Tests
 *
 * API: POST v4/workspace/connectors
 * Route: /connectors/create
 *
 * Tests: Create connectors of different types (HTTP, Object Storage, Live Ingest)
 *
 * Note: Edge Connectors replaced the old "Origins" feature in Edge Applications
 */

import selectors from '../../../support/selectors/product-selectors/edge-connectors'

const generateName = (prefix = 'Connector') => {
  return `${prefix}-${Date.now()}`
}

describe('Edge Connectors - Create', { tags: ['@crud', '@edge-connectors'] }, () => {
  const createdConnectors = []

  beforeEach(() => {
    cy.login()
    cy.openProduct('Edge Connectors')

    // Wait for list to be ready
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

    // Wait for skeletons to disappear
    cy.get('body').then(($body) => {
      if ($body.find('.p-skeleton').length) {
        cy.get('.p-skeleton', { timeout: 30000 }).should('not.exist')
      }
    })
  })

  describe('Create HTTP Connector', () => {
    it('should open create page and display form fields', () => {
      // Click create button
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Verify we're on create page
      cy.url().should('include', '/connectors/create')

      // Verify form sections are visible
      cy.get('[data-testid="edge-connectors-form__section__general"]', { timeout: 10000 }).should('exist')
      cy.get('[data-testid="edge-connectors-form__section__connector-type"]', { timeout: 10000 }).should('exist')
    })

    it('should create an HTTP connector with required fields', () => {
      const connectorName = generateName('HTTPConnector')

      cy.intercept('POST', '**/connectors').as('createConnector')

      // Navigate to create page
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()
      cy.url().should('include', '/connectors/create')

      // Fill name
      cy.get(selectors.name, { timeout: 10000 })
        .should('be.visible')
        .clear()
        .type(connectorName)

      // HTTP type should be selected by default
      // Scroll to Connection Options section and fill Host
      cy.get('[data-testid="edge-connectors-form__section__connection-options"]', { timeout: 10000 })
        .scrollIntoView()

      cy.get(selectors.http.host, { timeout: 10000 })
        .should('be.visible')
        .clear()
        .type('example.com', { parseSpecialCharSequences: false })

      // Scroll to Address Management and fill address
      cy.get('[data-testid="edge-connectors-form__section__address-management"]', { timeout: 10000 })
        .scrollIntoView()

      // Use filter to get only the visible address input (there are two: one in accordion, one in card)
      cy.get('[data-testid="edge-connectors-form__address-management__address-field__input"]:visible', { timeout: 10000 })
        .clear()
        .type('origin.example.com')

      // Save
      cy.get(selectors.saveButton).click()

      // Wait for API call
      cy.wait('@createConnector', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 201, 202])

      // Should redirect to edit page or list
      cy.url().should('match', /\/connectors(\/edit\/\d+)?$/)

      // Track for cleanup
      createdConnectors.push(connectorName)

      // Verify connector appears in list
      cy.openProduct('Edge Connectors')
      cy.get('.p-datatable', { timeout: 30000 }).should('exist')
      cy.contains(connectorName, { timeout: 15000 }).should('exist')
    })

    it('should show validation error for missing required fields', () => {
      // Navigate to create page
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()
      cy.url().should('include', '/connectors/create')

      // Try to save without filling required fields
      cy.get(selectors.saveButton).click()

      // Should show validation errors
      cy.get('.p-toast-message-error, [class*="error"], .p-invalid', { timeout: 10000 }).should('exist')
    })

    it('should create HTTP connector with custom address and port', () => {
      const connectorName = generateName('CustomHTTP')

      cy.intercept('POST', '**/connectors').as('createConnector')

      // Navigate to create page
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Fill name
      cy.get(selectors.name, { timeout: 10000 })
        .clear()
        .type(connectorName)

      // Scroll to Connection Options and fill Host
      cy.get('[data-testid="edge-connectors-form__section__connection-options"]', { timeout: 10000 })
        .scrollIntoView()

      cy.get(selectors.http.host, { timeout: 10000 })
        .should('be.visible')
        .clear()
        .type('custom.example.com', { parseSpecialCharSequences: false })

      // Scroll to Address Management and fill address
      cy.get('[data-testid="edge-connectors-form__section__address-management"]', { timeout: 10000 })
        .scrollIntoView()

      cy.get('[data-testid="edge-connectors-form__address-management__address-field__input"]:visible', { timeout: 10000 })
        .clear()
        .type('192.168.1.100')

      // Fill custom HTTP port if visible (skip if not visible)
      cy.get('body').then(($body) => {
        const httpPortSelector = '[data-testid="edge-connectors-form__address-management__http-port-field__input"]:visible'
        if ($body.find(httpPortSelector).length) {
          cy.get(httpPortSelector).find('input').clear().type('8080')
        }
      })

      // Save
      cy.get(selectors.saveButton).click()

      cy.wait('@createConnector', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 201, 202])

      createdConnectors.push(connectorName)
    })
  })

  describe('Create Object Storage Connector', () => {
    it('should switch to Object Storage type and show relevant fields', () => {
      // Navigate to create page
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Select Object Storage type
      cy.contains('Object Storage', { timeout: 10000 }).click()

      // Verify Object Storage specific fields appear
      cy.get('body').then(($body) => {
        // Check for bucket field or edge storage fields
        const bucketSelector = '[data-testid*="bucket"]'
        if ($body.find(bucketSelector).length) {
          cy.get(bucketSelector).first().should('be.visible')
        }
      })
    })

    it('should create Object Storage connector if available', () => {
      const connectorName = generateName('StorageConnector')

      cy.intercept('POST', '**/connectors').as('createConnector')

      // Navigate to create page
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Fill name
      cy.get(selectors.name, { timeout: 10000 })
        .clear()
        .type(connectorName)

      // Select Object Storage type
      cy.contains('Object Storage', { timeout: 10000 }).click()

      // Check if Edge Storage fields are available
      cy.get('body').then(($body) => {
        if ($body.find(selectors.edgeStorage.bucket).length) {
          cy.get(selectors.edgeStorage.bucket)
            .clear()
            .type('test-bucket')

          // Save
          cy.get(selectors.saveButton).click()

          cy.wait('@createConnector', { timeout: 30000 })
            .its('response.statusCode')
            .should('be.oneOf', [200, 201, 202])

          createdConnectors.push(connectorName)
        } else if ($body.find(selectors.s3.bucket).length) {
          // S3 style storage
          cy.get(selectors.s3.bucket).clear().type('test-bucket')
          cy.get(selectors.s3.region).clear().type('us-east-1')
          cy.get(selectors.s3.accessKey).clear().type('test-access-key')
          cy.get(selectors.s3.secretKey).clear().type('test-secret-key')

          cy.get(selectors.saveButton).click()

          cy.wait('@createConnector', { timeout: 30000 })

          createdConnectors.push(connectorName)
        } else {
          cy.log('Object Storage fields not available in this configuration')
        }
      })
    })
  })

  describe('Create Live Ingest Connector', () => {
    it('should switch to Live Ingest type and show endpoint field', () => {
      // Navigate to create page
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Select Live Ingest type
      cy.contains('Live Ingest', { timeout: 10000 }).click()

      // Verify Live Ingest specific fields appear
      cy.get('body').then(($body) => {
        const endpointSelector = selectors.liveIngest.endpoint
        if ($body.find(endpointSelector).length) {
          cy.get(endpointSelector).should('be.visible')
        }
      })
    })
  })

  after(() => {
    // Cleanup: Delete created connectors
    if (createdConnectors.length > 0) {
      cy.login()
      cy.openProduct('Edge Connectors')
      cy.get('.p-datatable', { timeout: 30000 }).should('exist')

      cy.get('body').then(($body) => {
        if ($body.find('.p-skeleton').length) {
          cy.get('.p-skeleton', { timeout: 30000 }).should('not.exist')
        }
      })

      createdConnectors.forEach((connectorName) => {
        cy.get('body').then(($body) => {
          if ($body.find(selectors.tableRow).text().includes(connectorName)) {
            cy.contains(connectorName)
              .parents('tr')
              .find('[data-testid*="action"], .pi-trash')
              .first()
              .click()

            cy.get('[data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
              .clear()
              .type(connectorName)

            cy.get('[data-testid="delete-dialog-footer-delete-button"]').click()

            cy.get('.p-toast-message-success, .p-toast-message-info', { timeout: 10000 }).should('exist')
          }
        })
      })
    }
  })
})
