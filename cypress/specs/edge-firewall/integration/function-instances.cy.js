/**
 * Edge Firewall - Function Instances Integration Tests
 *
 * API: POST/GET/PATCH/DELETE v4/workspace/firewalls/{id}/functions
 * Route: /edge-firewall/edit/{id}/functions
 *
 * Prerequisites: Requires an existing Edge Firewall with Edge Functions module enabled
 * Tests: Create, read, update, delete function instances
 *
 * Note: Edge Functions for Firewall must have execution_environment: 'firewall'
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/edge-firewall'

const generateName = (prefix = 'FuncInstance') => {
  return `${prefix}-${Date.now()}`
}

describe('Edge Firewall - Function Instances', { tags: ['@integration', '@edge-firewall', '@function-instances'] }, () => {
  let firewallName
  let firewallId

  before(() => {
    // Create an Edge Firewall with Edge Functions module enabled
    firewallName = generateName('FuncInstanceTestFirewall')

    cy.login()
    cy.openProduct('Edge Firewall')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

    // Wait for skeletons to disappear
    cy.get('body').then(($body) => {
      if ($body.find('.p-skeleton').length) {
        cy.get('.p-skeleton', { timeout: 30000 }).should('not.exist')
      }
    })

    // Create firewall
    cy.get(selectors.createButton, { timeout: 15000 }).click()
    cy.get(selectors.nameInput, { timeout: 15000 })
      .should('be.visible')
      .clear()
      .type(firewallName)

    // Enable Edge Functions module
    cy.get(selectors.edgeFunctionSwitch, { timeout: 10000 }).scrollIntoView().click()

    cy.get(selectors.formActions.saveButton).click()

    // Wait for creation to complete
    cy.url({ timeout: 30000 }).should('not.include', '/create')

    // Navigate to list and then to the firewall
    cy.openProduct('Edge Firewall')
    cy.get('.p-datatable', { timeout: 30000 }).should('exist')

    cy.get('body').then(($body) => {
      if ($body.find('.p-skeleton').length) {
        cy.get('.p-skeleton', { timeout: 30000 }).should('not.exist')
      }
    })

    tableHelpers.searchAndSubmit(firewallName)
    cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
      .contains(firewallName)
      .click()

    // Extract the firewall ID
    cy.url().should('match', /\/(edge-firewall|firewall|firewalls)\/edit\/\d+/)
    cy.url().then((url) => {
      const match = url.match(/edit\/(\d+)/)
      if (match) {
        firewallId = match[1]
      }
    })
  })

  beforeEach(() => {
    cy.login()
    cy.openProduct('Edge Firewall')

    // Wait for list to be ready
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

    cy.get('body').then(($body) => {
      if ($body.find('.p-skeleton').length) {
        cy.get('.p-skeleton', { timeout: 30000 }).should('not.exist')
      }
    })

    tableHelpers.searchAndSubmit(firewallName)
    cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 30000 })
      .contains(firewallName)
      .click()

    // Wait for edit page to load
    cy.url().should('match', /\/(edge-firewall|firewall|firewalls)\/edit\/\d+/)
  })

  // Helper to navigate to Functions tab
  const navigateToFunctionsTab = () => {
    cy.get(selectors.functionsTab, { timeout: 15000 }).click()
    // URL can be 'functions' or 'functionsInstances' depending on version
    cy.url().should('match', /functions|functionsInstances/)
  }

  // Helper to get create button
  const getCreateButton = () => {
    return cy.get(selectors.createFunctionInstanceButton, { timeout: 15000 })
  }

  describe('Functions Tab Navigation', () => {
    it('should navigate to Functions tab', () => {
      navigateToFunctionsTab()
      cy.url().should('include', 'functions')
    })

    it('should have create function instance button', () => {
      navigateToFunctionsTab()
      getCreateButton().should('be.visible')
    })
  })

  describe('Create Function Instance', () => {
    it('should open create function instance drawer', () => {
      navigateToFunctionsTab()
      getCreateButton().click()

      // Drawer should open
      cy.contains('h2', /Create Instance/i, { timeout: 15000 }).should('be.visible')

      // Name input should be visible
      cy.get(selectors.functionInstanceName, { timeout: 10000 })
        .should('be.visible')
    })

    it('should create a function instance selecting an existing edge function', () => {
      const instanceName = generateName('TestInstance')

      cy.intercept('POST', '**/functions').as('createFunctionInstance')

      navigateToFunctionsTab()
      getCreateButton().click()

      // Wait for drawer
      cy.contains('h2', /Create Instance/i, { timeout: 15000 }).should('be.visible')

      // Fill name
      cy.get(selectors.functionInstanceName, { timeout: 10000 })
        .clear()
        .type(instanceName)

      // Select an edge function from dropdown
      cy.get(selectors.functionInstanceDropdown, { timeout: 10000 }).click()

      // Wait for dropdown to load and select first option
      cy.get('li[role="option"]', { timeout: 15000 }).first().click()

      // Save
      cy.get(selectors.formActions.saveButton).click()

      // Wait for API call
      cy.wait('@createFunctionInstance', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 201, 202])

      // Verify drawer closes
      cy.contains('h2', /Create Instance/i, { timeout: 15000 }).should('not.exist')

      // Verify function instance appears in list
      cy.contains(instanceName, { timeout: 15000 }).should('exist')
    })

    it('should show validation error for missing edge function', () => {
      navigateToFunctionsTab()
      getCreateButton().click()

      cy.contains('h2', /Create Instance/i, { timeout: 15000 }).should('be.visible')

      // Fill only name, don't select function
      cy.get(selectors.functionInstanceName, { timeout: 10000 })
        .clear()
        .type('TestValidation')

      // Try to submit
      cy.get(selectors.formActions.saveButton).click()

      // Should show validation error (function is required)
      cy.get('.p-toast-message-error, [class*="error"], .p-invalid', { timeout: 10000 }).should('exist')
    })
  })

  describe('Edit Function Instance', () => {
    it('should open edit drawer when clicking on a function instance', () => {
      const instanceName = generateName('EditTest')

      cy.intercept('POST', '**/functions').as('createFunctionInstance')

      // Create a function instance
      navigateToFunctionsTab()
      getCreateButton().click()

      cy.contains('h2', /Create Instance/i, { timeout: 15000 }).should('be.visible')

      cy.get(selectors.functionInstanceName, { timeout: 10000 })
        .clear()
        .type(instanceName)

      cy.get(selectors.functionInstanceDropdown, { timeout: 10000 }).click()
      cy.get('li[role="option"]', { timeout: 15000 }).first().click()

      cy.get(selectors.formActions.saveButton).click()
      cy.wait('@createFunctionInstance', { timeout: 30000 })

      // Wait for drawer to close
      cy.contains('h2', /Create Instance/i, { timeout: 15000 }).should('not.exist')
      cy.wait(2000)

      // Click on the function instance to edit
      cy.contains(instanceName, { timeout: 15000 }).click()

      // Edit drawer should open
      cy.contains('h2', /Edit Instance/i, { timeout: 15000 }).should('be.visible')

      // Name should be pre-filled
      cy.get(selectors.functionInstanceName)
        .should('have.value', instanceName)
    })

    it('should update function instance name', () => {
      const originalName = generateName('OriginalFunc')
      const updatedName = generateName('UpdatedFunc')

      cy.intercept('POST', '**/functions').as('createFunctionInstance')
      cy.intercept('PATCH', '**/functions/**').as('updateFunctionInstance')

      // Create function instance
      navigateToFunctionsTab()
      getCreateButton().click()

      cy.contains('h2', /Create Instance/i, { timeout: 15000 }).should('be.visible')

      cy.get(selectors.functionInstanceName, { timeout: 10000 })
        .clear()
        .type(originalName)

      cy.get(selectors.functionInstanceDropdown, { timeout: 10000 }).click()
      cy.get('li[role="option"]', { timeout: 15000 }).first().click()

      cy.get(selectors.formActions.saveButton).click()
      cy.wait('@createFunctionInstance', { timeout: 30000 })

      cy.contains('h2', /Create Instance/i, { timeout: 15000 }).should('not.exist')
      cy.wait(2000)

      // Edit
      cy.contains(originalName, { timeout: 15000 }).click()

      cy.contains('h2', /Edit Instance/i, { timeout: 15000 }).should('be.visible')

      // Update name
      cy.get(selectors.functionInstanceName)
        .clear()
        .type(updatedName)

      cy.get(selectors.formActions.saveButton).click()

      cy.wait('@updateFunctionInstance', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 202])

      // Verify updated name in list
      cy.contains(updatedName, { timeout: 15000 }).should('exist')
    })
  })

  describe('Delete Function Instance', () => {
    it('should delete a function instance', () => {
      const instanceName = generateName('ToDelete')

      cy.intercept('POST', '**/functions').as('createFunctionInstance')
      cy.intercept('DELETE', '**/functions/**').as('deleteFunctionInstance')

      // Create function instance to delete
      navigateToFunctionsTab()
      getCreateButton().click()

      cy.contains('h2', /Create Instance/i, { timeout: 15000 }).should('be.visible')

      cy.get(selectors.functionInstanceName, { timeout: 10000 })
        .clear()
        .type(instanceName)

      cy.get(selectors.functionInstanceDropdown, { timeout: 10000 }).click()
      cy.get('li[role="option"]', { timeout: 15000 }).first().click()

      cy.get(selectors.formActions.saveButton).click()
      cy.wait('@createFunctionInstance', { timeout: 30000 })

      // Wait for drawer to close
      cy.contains('h2', /Create Instance/i, { timeout: 15000 }).should('not.exist')
      cy.wait(2000)

      // Find and delete
      cy.contains(instanceName, { timeout: 30000 })
        .parents('tr')
        .find('[data-testid="data-table-actions-column-body-action-button"], .pi-trash')
        .first()
        .click()

      // Confirm deletion
      cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
        .clear()
        .type(instanceName)

      cy.get(selectors.deleteDialog.deleteButton).click()

      // Wait for delete API call
      cy.wait('@deleteFunctionInstance', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 202, 204])

      // Verify success
      cy.get('.p-toast-message-success, .p-toast-message-info', { timeout: 10000 }).should('exist')
    })
  })

  describe('Function Instance with JSON Args', () => {
    it('should create function instance with default JSON args if available', () => {
      const instanceName = generateName('WithArgs')

      cy.intercept('POST', '**/functions').as('createFunctionInstance')

      navigateToFunctionsTab()
      getCreateButton().click()

      cy.contains('h2', /Create Instance/i, { timeout: 15000 }).should('be.visible')

      // Fill name
      cy.get(selectors.functionInstanceName, { timeout: 10000 })
        .clear()
        .type(instanceName)

      // Select edge function - this should load default args
      cy.get(selectors.functionInstanceDropdown, { timeout: 10000 }).click()
      cy.get('li[role="option"]', { timeout: 15000 }).first().click()

      // Wait a moment for args to load
      cy.wait(1000)

      // Check if JSON args field exists and has content
      cy.get('body').then(($body) => {
        const jsonArgsSelector = '.monaco-editor, [data-testid*="args"]'
        if ($body.find(jsonArgsSelector).length) {
          // Monaco editor or args field exists - just verify it's present
          cy.get(jsonArgsSelector).first().should('exist')
        }
      })

      cy.get(selectors.formActions.saveButton).click()

      cy.wait('@createFunctionInstance', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 201, 202])

      cy.contains(instanceName, { timeout: 15000 }).should('exist')
    })
  })

  describe('Search Function Instances', () => {
    it('should filter function instances by search term', () => {
      const instanceName = generateName('SearchTest')

      cy.intercept('POST', '**/functions').as('createFunctionInstance')

      // Create function instance
      navigateToFunctionsTab()
      getCreateButton().click()

      cy.contains('h2', /Create Instance/i, { timeout: 15000 }).should('be.visible')

      cy.get(selectors.functionInstanceName, { timeout: 10000 })
        .clear()
        .type(instanceName)

      cy.get(selectors.functionInstanceDropdown, { timeout: 10000 }).click()
      cy.get('li[role="option"]', { timeout: 15000 }).first().click()

      cy.get(selectors.formActions.saveButton).click()
      cy.wait('@createFunctionInstance', { timeout: 30000 })

      cy.contains('h2', /Create Instance/i, { timeout: 15000 }).should('not.exist')
      cy.wait(2000)

      // Search for the created instance
      cy.get(selectors.functionInstanceTableSearchInput, { timeout: 10000 })
        .clear()
        .type(instanceName)
        .type('{enter}')

      // Verify search results
      cy.get(selectors.functionInstanceTableColumnName, { timeout: 15000 })
        .should('contain', instanceName)
    })
  })

  after(() => {
    // Cleanup: Delete the test firewall
    if (firewallName) {
      cy.login()
      cy.openProduct('Edge Firewall')
      cy.get('.p-datatable', { timeout: 30000 }).should('exist')

      cy.get('body').then(($body) => {
        if ($body.find('.p-skeleton').length) {
          cy.get('.p-skeleton', { timeout: 30000 }).should('not.exist')
        }
      })

      tableHelpers.searchAndSubmit(firewallName)

      cy.get('body').then(($body) => {
        if ($body.find('[data-testid*="list-table-block__column__name"]').text().includes(firewallName)) {
          cy.get('[data-testid*="list-table-block__column__name"]')
            .contains(firewallName)
            .parents('tr')
            .find(selectors.actions.menuButton)
            .click()

          cy.contains('Delete').click()

          cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
            .clear()
            .type(firewallName)

          cy.get(selectors.deleteDialog.deleteButton).click()
        }
      })
    }
  })
})
