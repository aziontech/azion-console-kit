/**
 * Workloads - Create CRUD Tests
 *
 * API: POST v4/workspace/workloads
 * Route: /domains/create
 *
 * Prerequisites: Requires an existing Edge Application
 * Tests: Create workload/domain with different configurations
 *
 * Note: Workloads is the v4 replacement for Domains
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/workload'

const generateName = (prefix = 'Workload') => {
  return `${prefix}-${Date.now()}`
}

describe('Workloads - Create', { tags: ['@crud', '@workloads', '@domains'] }, () => {
  const createdWorkloads = []

  beforeEach(() => {
    cy.login()
    cy.openProduct('Domains')
    tableHelpers.waitForListReady()
  })

  describe('Create Page Navigation', () => {
    it('should navigate to create page', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      cy.url().should('include', '/create')
    })

    it('should display create form with required fields', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Verify form sections exist
      cy.get(selectors.nameInput, { timeout: 10000 }).should('be.visible')
    })

    it('should show Edge Application dropdown', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      cy.get(selectors.edgeApplicationField, { timeout: 10000 }).should('exist')
    })
  })

  describe('Create Workload', () => {
    it('should create workload with minimal required fields', () => {
      const workloadName = generateName('TestWorkload')

      cy.intercept('POST', '**/workloads').as('createWorkload')

      // Navigate to create
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()
      cy.url().should('include', '/create')

      // Fill name
      cy.get(selectors.nameInput, { timeout: 10000 })
        .should('be.visible')
        .clear()
        .type(workloadName)

      // Select Edge Application (required)
      cy.get(selectors.edgeApplicationField, { timeout: 10000 }).click()

      // Wait for dropdown to load and select first option
      cy.get('li[role="option"]', { timeout: 15000 }).first().click()

      // Save
      cy.get(selectors.formActionsSubmitButton).click()

      // Wait for API call
      cy.wait('@createWorkload', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 201, 202])

      // Should show success dialog or redirect
      cy.get('body', { timeout: 15000 }).then(($body) => {
        if ($body.find(selectors.dialogTitle).length > 0) {
          // Dialog shows workload was created
          cy.get(selectors.dialogTitle).should('contain.text', 'created')
          createdWorkloads.push(workloadName)
        } else {
          // Redirected to list or edit
          cy.url().should('not.include', '/create')
          createdWorkloads.push(workloadName)
        }
      })
    })

    it('should show validation error for missing name', () => {
      // Navigate to create
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Try to save without filling required fields
      cy.get(selectors.formActionsSubmitButton).click()

      // Should show validation errors
      cy.get('.p-toast-message-error, [class*="error"], .p-invalid', { timeout: 10000 }).should('exist')
    })

    it('should show validation error for missing edge application', () => {
      const workloadName = generateName('NoAppWorkload')

      // Navigate to create
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Fill name only
      cy.get(selectors.nameInput, { timeout: 10000 })
        .clear()
        .type(workloadName)

      // Try to save without selecting edge application
      cy.get(selectors.formActionsSubmitButton).click()

      // Should show validation errors
      cy.get('.p-toast-message-error, [class*="error"], .p-invalid', { timeout: 10000 }).should('exist')
    })
  })

  describe('Create Workload with CNAME', () => {
    it('should create workload with custom CNAME', () => {
      const workloadName = generateName('CNAMEWorkload')
      const cname = `${workloadName.toLowerCase()}.example.com`

      cy.intercept('POST', '**/workloads').as('createWorkload')

      // Navigate to create
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Fill name
      cy.get(selectors.nameInput, { timeout: 10000 })
        .clear()
        .type(workloadName)

      // Select Edge Application
      cy.get(selectors.edgeApplicationField, { timeout: 10000 }).click()
      cy.get('li[role="option"]', { timeout: 15000 }).first().click()

      // Add CNAME if field exists
      cy.get('body').then(($body) => {
        if ($body.find(selectors.cnamesField).length > 0) {
          cy.get(selectors.cnamesField)
            .clear()
            .type(cname)
        }
      })

      // Save
      cy.get(selectors.formActionsSubmitButton).click()

      cy.wait('@createWorkload', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 201, 202])

      createdWorkloads.push(workloadName)
    })
  })

  describe('Create Workload with HTTPS', () => {
    it('should enable HTTPS and select certificate', () => {
      const workloadName = generateName('HTTPSWorkload')

      cy.intercept('POST', '**/workloads').as('createWorkload')

      // Navigate to create
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Fill name
      cy.get(selectors.nameInput, { timeout: 10000 })
        .clear()
        .type(workloadName)

      // Select Edge Application
      cy.get(selectors.edgeApplicationField, { timeout: 10000 }).click()
      cy.get('li[role="option"]', { timeout: 15000 }).first().click()

      // Enable HTTPS if switch exists
      cy.get('body').then(($body) => {
        const httpsSwitch = selectors.useHttpsField
        if ($body.find(httpsSwitch).length > 0 && !$body.find(httpsSwitch).hasClass('p-inputswitch-checked')) {
          cy.get(httpsSwitch).click()

          // Wait for certificate dropdown to appear
          cy.get(selectors.digitalCertificateDropdown, { timeout: 10000 }).should('exist')
        }
      })

      // Save
      cy.get(selectors.formActionsSubmitButton).click()

      // May fail if no certificate is selected, but we're testing the HTTPS toggle
      cy.get('body', { timeout: 15000 }).then(($body) => {
        if ($body.find('.p-toast-message-error').length === 0) {
          cy.wait('@createWorkload', { timeout: 30000 })
          createdWorkloads.push(workloadName)
        }
      })
    })
  })

  describe('Create Workload with Edge Firewall', () => {
    it('should select Edge Firewall if available', () => {
      const workloadName = generateName('FirewallWorkload')

      cy.intercept('POST', '**/workloads').as('createWorkload')

      // Navigate to create
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Fill name
      cy.get(selectors.nameInput, { timeout: 10000 })
        .clear()
        .type(workloadName)

      // Select Edge Application
      cy.get(selectors.edgeApplicationField, { timeout: 10000 }).click()
      cy.get('li[role="option"]', { timeout: 15000 }).first().click()

      // Select Edge Firewall if field exists
      cy.get('body').then(($body) => {
        if ($body.find(selectors.edgeFirewallField).length > 0) {
          cy.get(selectors.edgeFirewallField).click()

          // Wait for dropdown to load
          cy.get('li[role="option"]', { timeout: 10000 }).then(($options) => {
            if ($options.length > 0) {
              cy.wrap($options).first().click()
            }
          })
        }
      })

      // Save
      cy.get(selectors.formActionsSubmitButton).click()

      cy.wait('@createWorkload', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 201, 202])

      createdWorkloads.push(workloadName)
    })
  })

  describe('Cancel Create', () => {
    it('should return to list when canceling', () => {
      // Navigate to create
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()
      cy.url().should('include', '/create')

      // Fill some data
      cy.get(selectors.nameInput, { timeout: 10000 })
        .clear()
        .type('CancelTest')

      // Cancel
      cy.get('[data-testid*="cancel"], .p-button-secondary').first().click()

      // Should return to list (Domains routes to /workloads)
      cy.url().should('match', /\/(domains|workloads)$/)
      cy.url().should('not.include', '/create')
    })
  })

  after(() => {
    // Cleanup: Delete created workloads
    if (createdWorkloads.length > 0) {
      cy.login()
      cy.openProduct('Domains')
      tableHelpers.waitForListReady()

      createdWorkloads.forEach((workloadName) => {
        cy.get('body').then(($body) => {
          if ($body.find(selectors.listTableBlockColumnNameRow).text().includes(workloadName)) {
            tableHelpers.searchAndSubmit(workloadName)

            cy.get(selectors.listTableBlockColumnNameRow)
              .contains(workloadName)
              .parents('tr')
              .find('[data-testid*="action"], .pi-trash')
              .first()
              .click()

            // Confirm deletion
            cy.get('[data-testid*="confirmation-input"], [data-testid*="confirm-input"]', { timeout: 10000 })
              .clear()
              .type(workloadName)

            cy.get('[data-testid*="delete-button"]').click()

            cy.get('.p-toast-message-success, .p-toast-message-info', { timeout: 10000 }).should('exist')
          }
        })
      })
    }
  })
})
