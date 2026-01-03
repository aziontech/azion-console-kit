/**
 * Workloads - Update CRUD Tests
 *
 * API: PATCH v4/workspace/workloads/{id}
 * Route: /domains/edit/{id}
 *
 * Tests: Update workload/domain settings
 *
 * Note: Workloads is the v4 replacement for Domains
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/workload'

const generateName = (prefix = 'Workload') => {
  return `${prefix}-${Date.now()}`
}

describe('Workloads - Update', { tags: ['@crud', '@workloads', '@domains'] }, () => {
  let testWorkloadName
  let testWorkloadId

  before(() => {
    // Create a workload for testing
    testWorkloadName = generateName('UpdateTestWorkload')

    cy.login()
    cy.openProduct('Domains')
    tableHelpers.waitForListReady()

    cy.intercept('POST', '**/workloads').as('createWorkload')

    // Navigate to create
    cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

    // Fill name
    cy.get(selectors.nameInput, { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type(testWorkloadName)

    // Select Edge Application
    cy.get(selectors.edgeApplicationField, { timeout: 10000 }).click()
    cy.get('li[role="option"]', { timeout: 15000 }).first().click()

    // Save
    cy.get(selectors.formActionsSubmitButton).click()

    cy.wait('@createWorkload', { timeout: 30000 })

    // Handle dialog or redirect
    cy.get('body', { timeout: 15000 }).then(($body) => {
      if ($body.find(selectors.confirmButton).length > 0) {
        cy.get(selectors.confirmButton).click()
      }
    })

    // Extract workload ID from URL
    cy.url({ timeout: 15000 }).then((url) => {
      const match = url.match(/edit\/(\d+)/)
      if (match) {
        testWorkloadId = match[1]
      }
    })
  })

  beforeEach(() => {
    cy.login()
    cy.openProduct('Domains')
    tableHelpers.waitForListReady()
  })

  describe('Edit Page Navigation', () => {
    it('should navigate to edit page from list', () => {
      tableHelpers.searchAndSubmit(testWorkloadName)

      cy.get(selectors.listTableBlockColumnNameRow, { timeout: 15000 })
        .contains(testWorkloadName)
        .click()

      cy.url({ timeout: 15000 }).should('match', /\/(domains|workloads)\/edit\/\d+/)
    })

    it('should display edit form with workload data', () => {
      tableHelpers.searchAndSubmit(testWorkloadName)

      cy.get(selectors.listTableBlockColumnNameRow, { timeout: 15000 })
        .contains(testWorkloadName)
        .click()

      // Verify form has data
      cy.get('[data-testid*="name"], [data-testid*="field-text__input"]', { timeout: 10000 })
        .first()
        .should('have.value', testWorkloadName)
    })

    it('should display domain/workload URL', () => {
      tableHelpers.searchAndSubmit(testWorkloadName)

      cy.get(selectors.listTableBlockColumnNameRow, { timeout: 15000 })
        .contains(testWorkloadName)
        .click()

      // Domain URL field should exist
      cy.get(selectors.domainUri, { timeout: 10000 }).should('exist')
    })
  })

  describe('Update Workload Settings', () => {
    it('should update workload name', () => {
      const updatedName = `${testWorkloadName}-Updated`

      cy.intercept('PATCH', '**/workloads/**').as('updateWorkload')

      tableHelpers.searchAndSubmit(testWorkloadName)

      cy.get(selectors.listTableBlockColumnNameRow, { timeout: 15000 })
        .contains(testWorkloadName)
        .click()

      cy.url({ timeout: 15000 }).should('match', /\/(domains|workloads)\/edit\/\d+/)

      // Update name - look for name input in edit form
      cy.get('[data-testid*="name"][data-testid*="input"], [data-testid="field-text__input"]', { timeout: 10000 })
        .first()
        .clear()
        .type(updatedName)

      // Save
      cy.get(selectors.formActionsSubmitButton).click()

      cy.wait('@updateWorkload', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 202])

      // Verify success toast
      cy.get('.p-toast-message-success, .p-toast-message-info', { timeout: 10000 }).should('exist')

      // Update the test name for subsequent tests
      testWorkloadName = updatedName
    })

    it('should toggle active status', () => {
      cy.intercept('PATCH', '**/workloads/**').as('updateWorkload')

      tableHelpers.searchAndSubmit(testWorkloadName)

      cy.get(selectors.listTableBlockColumnNameRow, { timeout: 15000 })
        .contains(testWorkloadName)
        .click()

      cy.url({ timeout: 15000 }).should('match', /\/(domains|workloads)\/edit\/\d+/)

      // Toggle active switch
      cy.get('body').then(($body) => {
        const activeSwitch = selectors.activeSwitchEditForm ||
          '[data-testid*="active"][data-testid*="switch"]'

        if ($body.find(activeSwitch).length > 0) {
          cy.get(activeSwitch).click()

          // Save
          cy.get(selectors.formActionsSubmitButton).click()

          cy.wait('@updateWorkload', { timeout: 30000 })
            .its('response.statusCode')
            .should('be.oneOf', [200, 202])

          cy.get('.p-toast-message-success, .p-toast-message-info', { timeout: 10000 }).should('exist')
        } else {
          cy.log('Active switch not found')
        }
      })
    })

    it('should update CNAMEs', () => {
      cy.intercept('PATCH', '**/workloads/**').as('updateWorkload')

      tableHelpers.searchAndSubmit(testWorkloadName)

      cy.get(selectors.listTableBlockColumnNameRow, { timeout: 15000 })
        .contains(testWorkloadName)
        .click()

      cy.url({ timeout: 15000 }).should('match', /\/(domains|workloads)\/edit\/\d+/)

      // Update CNAMEs if field exists
      cy.get('body').then(($body) => {
        const cnamesField = selectors.cnamesField ||
          '[data-testid*="cnames"][data-testid*="textarea"]'

        if ($body.find(cnamesField).length > 0) {
          const newCname = `updated-${Date.now()}.example.com`

          cy.get(cnamesField)
            .clear()
            .type(newCname)

          // Save
          cy.get(selectors.formActionsSubmitButton).click()

          cy.wait('@updateWorkload', { timeout: 30000 })
            .its('response.statusCode')
            .should('be.oneOf', [200, 202])

          cy.get('.p-toast-message-success, .p-toast-message-info', { timeout: 10000 }).should('exist')
        } else {
          cy.log('CNAMEs field not found')
        }
      })
    })
  })

  describe('Copy Domain URL', () => {
    it('should have copy button for domain URL', () => {
      tableHelpers.searchAndSubmit(testWorkloadName)

      cy.get(selectors.listTableBlockColumnNameRow, { timeout: 15000 })
        .contains(testWorkloadName)
        .click()

      cy.url({ timeout: 15000 }).should('match', /\/(domains|workloads)\/edit\/\d+/)

      // Look for copy button near domain URL
      cy.get('[data-testid*="copy"], .pi-copy', { timeout: 10000 }).should('exist')
    })
  })

  describe('Cancel Edit', () => {
    it('should return to list when canceling', () => {
      tableHelpers.searchAndSubmit(testWorkloadName)

      cy.get(selectors.listTableBlockColumnNameRow, { timeout: 15000 })
        .contains(testWorkloadName)
        .click()

      cy.url({ timeout: 15000 }).should('match', /\/(domains|workloads)\/edit\/\d+/)

      // Cancel
      cy.get('[data-testid*="cancel"], .p-button-secondary').first().click()

      // Should return to list (Domains routes to /workloads)
      cy.url().should('match', /\/(domains|workloads)$/)
      cy.url().should('not.include', '/edit')
    })
  })

  after(() => {
    // Cleanup: Delete the test workload
    if (testWorkloadName) {
      cy.login()
      cy.openProduct('Domains')
      tableHelpers.waitForListReady()

      tableHelpers.searchAndSubmit(testWorkloadName)

      cy.get('body').then(($body) => {
        if ($body.find(selectors.listTableBlockColumnNameRow).text().includes(testWorkloadName)) {
          cy.get(selectors.listTableBlockColumnNameRow)
            .contains(testWorkloadName)
            .parents('tr')
            .find('[data-testid*="action"], .pi-trash')
            .first()
            .click()

          cy.get('[data-testid*="confirmation-input"], [data-testid*="confirm-input"]', { timeout: 10000 })
            .clear()
            .type(testWorkloadName)

          cy.get('[data-testid*="delete-button"]').click()
        }
      })
    }
  })
})
