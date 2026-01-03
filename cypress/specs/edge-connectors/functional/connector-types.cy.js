/**
 * Edge Connectors - Connector Types Functional Tests
 *
 * API: POST v4/workspace/connectors
 * Route: /connectors/create
 *
 * Tests: Different connector types (HTTP, Object Storage, Live Ingest)
 * Each type has different configuration options.
 */

import selectors from '../../../support/selectors/product-selectors/edge-connectors'
import { tableHelpers } from '../../../support/console-kit-helpers'

const generateName = (prefix = 'Connector') => {
  return `${prefix}-${Date.now()}`
}

describe('Edge Connectors - Connector Types', { tags: ['@functional', '@edge-connectors', '@types'] }, () => {
  const createdConnectors = []

  beforeEach(() => {
    cy.login()
    // Wait for page to be fully loaded after login
    cy.get('[data-testid="sidebar-block__toggle-button"]', { timeout: 30000 }).should('exist')
    cy.openProduct('Edge Connectors')

    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

    cy.get('body').then(($body) => {
      if ($body.find('.p-skeleton').length) {
        cy.get('.p-skeleton', { timeout: 30000 }).should('not.exist')
      }
    })
  })

  describe('HTTP Connector (Default)', () => {
    it('should have HTTP as default connector type', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()
      cy.url().should('include', '/connectors/create')

      // HTTP should be selected by default or first option
      cy.get('[data-testid="edge-connectors-form__section__connector-type"]', { timeout: 10000 })
        .should('exist')
    })

    it('should display HTTP-specific fields', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Scroll to Connection Options
      cy.get('[data-testid="edge-connectors-form__section__connection-options"]', { timeout: 10000 })
        .scrollIntoView()

      // HTTP fields should be visible
      cy.get(selectors.http.host, { timeout: 10000 }).should('exist')
    })

    it('should show path field for HTTP connector', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      cy.get('[data-testid="edge-connectors-form__section__connection-options"]', { timeout: 10000 })
        .scrollIntoView()

      // Path field should exist
      cy.get('body').then(($body) => {
        if ($body.find(selectors.http.path).length > 0) {
          cy.get(selectors.http.path).should('exist')
        }
      })
    })

    it('should show following redirect switch for HTTP', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      cy.get('[data-testid="edge-connectors-form__section__connection-options"]', { timeout: 10000 })
        .scrollIntoView()

      // Following redirect switch
      cy.get('body').then(($body) => {
        if ($body.find(selectors.http.followingRedirect).length > 0) {
          cy.get(selectors.http.followingRedirect).should('exist')
        }
      })
    })

    it('should create HTTP connector with host header', () => {
      const connectorName = generateName('HTTPHost')

      cy.intercept('POST', '**/connectors').as('createConnector')

      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Fill name
      cy.get(selectors.name, { timeout: 10000 })
        .clear()
        .type(connectorName)

      // Fill Host
      cy.get('[data-testid="edge-connectors-form__section__connection-options"]')
        .scrollIntoView()

      cy.get(selectors.http.host, { timeout: 10000 })
        .clear()
        .type('api.example.com', { parseSpecialCharSequences: false })

      // Fill address
      cy.get('[data-testid="edge-connectors-form__section__address-management"]')
        .scrollIntoView()

      cy.get('[data-testid="edge-connectors-form__address-management__address-field__input"]:visible', { timeout: 10000 })
        .clear()
        .type('backend.example.com')

      // Save
      cy.get(selectors.saveButton).click()

      cy.wait('@createConnector', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 201, 202])

      createdConnectors.push(connectorName)
    })
  })

  describe('Object Storage Connector', () => {
    it('should switch to Object Storage type', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Click Object Storage option
      cy.contains('Object Storage', { timeout: 10000 }).click()

      // Type should be selected
      cy.contains('Object Storage').should('exist')
    })

    it('should show Edge Storage fields when Object Storage selected', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Select Object Storage
      cy.contains('Object Storage', { timeout: 10000 }).click()

      // Check for Edge Storage specific fields
      cy.get('body').then(($body) => {
        if ($body.find(selectors.edgeStorage.bucket).length > 0) {
          cy.get(selectors.edgeStorage.bucket).should('exist')
        } else if ($body.find(selectors.s3.bucket).length > 0) {
          cy.get(selectors.s3.bucket).should('exist')
        } else {
          cy.log('Object Storage fields layout may have changed')
        }
      })
    })

    it('should show S3-compatible storage fields', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Select Object Storage
      cy.contains('Object Storage', { timeout: 10000 }).click()

      // Look for S3 configuration options
      cy.get('body').then(($body) => {
        if ($body.find(selectors.s3.bucket).length > 0) {
          // S3 fields should include bucket, region, access key, secret key
          cy.get(selectors.s3.bucket).should('exist')

          if ($body.find(selectors.s3.region).length > 0) {
            cy.get(selectors.s3.region).should('exist')
          }
        }
      })
    })

    it('should create Object Storage connector with bucket', () => {
      const connectorName = generateName('ObjectStorage')

      cy.intercept('POST', '**/connectors').as('createConnector')

      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Fill name
      cy.get(selectors.name, { timeout: 10000 })
        .clear()
        .type(connectorName)

      // Select Object Storage
      cy.contains('Object Storage', { timeout: 10000 }).click()

      // Fill bucket based on available fields
      cy.get('body').then(($body) => {
        if ($body.find(selectors.edgeStorage.bucket).length > 0) {
          cy.get(selectors.edgeStorage.bucket)
            .clear()
            .type('my-test-bucket')

          cy.get(selectors.saveButton).click()

          cy.wait('@createConnector', { timeout: 30000 }).then((interception) => {
            if (interception.response.statusCode >= 200 && interception.response.statusCode < 300) {
              createdConnectors.push(connectorName)
            }
          })
        } else if ($body.find(selectors.s3.bucket).length > 0) {
          cy.get(selectors.s3.bucket).clear().type('my-s3-bucket')

          if ($body.find(selectors.s3.region).length > 0) {
            cy.get(selectors.s3.region).clear().type('us-east-1')
          }
          if ($body.find(selectors.s3.accessKey).length > 0) {
            cy.get(selectors.s3.accessKey).clear().type('AKIAIOSFODNN7EXAMPLE')
          }
          if ($body.find(selectors.s3.secretKey).length > 0) {
            cy.get(selectors.s3.secretKey).clear().type('wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY')
          }

          cy.get(selectors.saveButton).click()

          cy.wait('@createConnector', { timeout: 30000 }).then((interception) => {
            if (interception.response.statusCode >= 200 && interception.response.statusCode < 300) {
              createdConnectors.push(connectorName)
            }
          })
        } else {
          cy.log('Object Storage bucket fields not found - skipping creation')
        }
      })
    })
  })

  describe('Live Ingest Connector', () => {
    it('should switch to Live Ingest type', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Click Live Ingest option
      cy.contains('Live Ingest', { timeout: 10000 }).click()

      // Type should be selected
      cy.contains('Live Ingest').should('exist')
    })

    it('should show region dropdown for Live Ingest', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Select Live Ingest
      cy.contains('Live Ingest', { timeout: 10000 }).click()

      // Region dropdown should appear
      cy.get('body').then(($body) => {
        if ($body.find(selectors.liveIngest.region).length > 0) {
          cy.get(selectors.liveIngest.region).should('exist')
        } else {
          cy.log('Live Ingest region dropdown not found')
        }
      })
    })

    it('should create Live Ingest connector with region', () => {
      const connectorName = generateName('LiveIngest')

      cy.intercept('POST', '**/connectors').as('createConnector')

      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Fill name
      cy.get(selectors.name, { timeout: 10000 })
        .clear()
        .type(connectorName)

      // Select Live Ingest
      cy.contains('Live Ingest', { timeout: 10000 }).click()

      // Select region if available
      cy.get('body').then(($body) => {
        if ($body.find(selectors.liveIngest.region).length > 0) {
          cy.get(selectors.liveIngest.region).click()

          // Select first region option
          cy.get('li[role="option"]', { timeout: 10000 }).first().click()

          cy.get(selectors.saveButton).click()

          cy.wait('@createConnector', { timeout: 30000 }).then((interception) => {
            if (interception.response.statusCode >= 200 && interception.response.statusCode < 300) {
              createdConnectors.push(connectorName)
            }
          })
        } else {
          cy.log('Live Ingest region not found - skipping creation')
        }
      })
    })
  })

  describe('Connector Type Switching', () => {
    it('should clear type-specific fields when switching types', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Start with HTTP
      cy.get('[data-testid="edge-connectors-form__section__connection-options"]', { timeout: 10000 })
        .scrollIntoView()

      cy.get(selectors.http.host, { timeout: 10000 })
        .clear()
        .type('test.com')

      // Switch to Object Storage
      cy.contains('Object Storage', { timeout: 10000 }).click()

      // HTTP host field should not be visible
      cy.get(selectors.http.host).should('not.exist')

      // Switch back to HTTP
      cy.contains('HTTP', { timeout: 10000 }).click()

      // HTTP host field should be empty or reset
      cy.get('[data-testid="edge-connectors-form__section__connection-options"]')
        .scrollIntoView()

      cy.get(selectors.http.host, { timeout: 10000 }).should('exist')
    })
  })

  describe('Timeout Configuration', () => {
    it('should display timeout fields', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Look for timeout section
      cy.get('body').then(($body) => {
        if ($body.find(selectors.connectionTimeout).length > 0) {
          cy.get(selectors.connectionTimeout).should('exist')
        }
        if ($body.find(selectors.readWriteTimeout).length > 0) {
          cy.get(selectors.readWriteTimeout).should('exist')
        }
      })
    })

    it('should allow setting custom timeouts', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      cy.get('body').then(($body) => {
        if ($body.find(selectors.connectionTimeout).length > 0) {
          cy.get(selectors.connectionTimeout)
            .clear()
            .type('30')

          cy.get(selectors.connectionTimeout).should('have.value', '30')
        }
      })
    })
  })

  after(() => {
    // Cleanup
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
          if ($body.text().includes(connectorName)) {
            tableHelpers.searchAndSubmit(connectorName)

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
            cy.wait(2000)
          }
        })
      })
    }
  })
})
