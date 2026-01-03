/**
 * Edge Applications - Function Instances Integration Tests
 *
 * API: POST/GET/PATCH/DELETE v4/workspace/applications/{id}/functions
 * Route: /edge-application/edit/{id}/functions
 *
 * Prerequisites: Requires an existing Edge Application with Edge Functions module enabled
 * Tests: Create, read, update, delete function instances
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/edge-application'

const generateName = (prefix = 'FuncInstance') => {
  // Use hyphen instead of underscore for consistency
  return `${prefix}-${Date.now()}`
}

describe('Edge Applications - Function Instances', { tags: ['@integration', '@edge-applications', '@function-instances'] }, () => {
  let applicationName
  let applicationId

  before(() => {
    // Create an Edge Application with Edge Functions enabled
    applicationName = generateName('FuncInstanceTestApp')

    cy.login()
    cy.openProduct('Edge Application')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

    // Create application
    cy.get(selectors.mainSettings.createButton, { timeout: 15000 }).click()
    cy.get(selectors.mainSettings.nameInput, { timeout: 15000 })
      .should('be.visible')
      .clear()
      .type(applicationName)

    // Handle v4 form with address field
    cy.get('body').then(($body) => {
      if ($body.find(selectors.mainSettings.addressInput).length) {
        cy.get(selectors.mainSettings.addressInput)
          .clear()
          .type('httpbin.org')
      }
    })

    cy.get(selectors.formActions.saveButton).click()

    // Wait for creation to complete
    cy.url({ timeout: 30000 }).should('not.include', '/create')

    // Navigate to list and then to the application
    cy.openProduct('Edge Application')
    cy.get('.p-datatable', { timeout: 30000 }).should('exist')
    cy.get('.p-skeleton', { timeout: 30000 }).should('not.exist')

    tableHelpers.searchAndSubmit(applicationName)
    cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
      .contains(applicationName)
      .click()

    // Extract the application ID
    cy.url().should('match', /\/(edge-application|applications)\/edit\/\d+/)
    cy.url().then((url) => {
      const match = url.match(/edit\/(\d+)/)
      if (match) {
        applicationId = match[1]
      }
    })

    // Enable Edge Functions module
    cy.get(selectors.tabs('Main Settings'), { timeout: 15000 }).click()
    cy.wait(2000)

    // Try to enable Edge Functions module
    const edgeFunctionsSelector = '[data-testid*="edgeFunctions"] .p-inputswitch-slider, [data-testid*="edge-functions"] .p-inputswitch-slider'
    cy.get('body').then(($body) => {
      if ($body.find(edgeFunctionsSelector).length) {
        cy.get(edgeFunctionsSelector).first().then(($switch) => {
          const parentSwitch = $switch.closest('.p-inputswitch')
          if (parentSwitch && !parentSwitch.hasClass('p-inputswitch-checked')) {
            cy.wrap($switch).click()
            cy.get(selectors.formActions.saveButton).click()
            cy.get('.p-toast-message-success, .p-toast-message-info', { timeout: 30000 }).should('exist')
            cy.wait(3000)
          }
        })
      }
    })
  })

  beforeEach(() => {
    cy.login()
    // Navigate to the created application
    cy.openProduct('Edge Application')

    // Wait for list to be ready with extended timeout for slow API
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

    // Wait for skeletons with extended timeout
    cy.get('body').then(($body) => {
      if ($body.find('.p-skeleton').length) {
        cy.get('.p-skeleton', { timeout: 30000 }).should('not.exist')
      }
    })

    tableHelpers.searchAndSubmit(applicationName)
    cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 30000 })
      .contains(applicationName)
      .click()

    // Wait for edit page to load
    cy.url().should('match', /\/(edge-application|applications)\/edit\/\d+/)
  })

  // Helper to navigate to Functions tab
  const navigateToFunctionsTab = () => {
    // Tab name might be "Functions Instances" or "Functions" depending on version
    cy.get('body').then(($body) => {
      if ($body.find(selectors.tabs('Functions Instances')).length) {
        cy.get(selectors.tabs('Functions Instances'), { timeout: 15000 }).click()
      } else {
        cy.get(selectors.tabs('Functions'), { timeout: 15000 }).click()
      }
    })
    cy.url().should('include', 'functions')
  }

  // Helper to get create button
  const getCreateButton = () => {
    return cy.get(selectors.functionsInstance.createButton, { timeout: 15000 })
  }

  describe('Functions Instances Tab Navigation', () => {
    it('should navigate to Functions Instances tab', () => {
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
      cy.contains('h2', /Create Function|Create Instance/i, { timeout: 15000 }).should('be.visible')

      // Name input should be visible
      cy.get(selectors.functionsInstance.nameInput, { timeout: 10000 })
        .should('be.visible')
    })

    it('should create a function instance selecting an existing edge function', () => {
      const instanceName = generateName('TestInstance')

      cy.intercept('POST', '**/functions').as('createFunctionInstance')

      navigateToFunctionsTab()
      getCreateButton().click()

      // Wait for drawer
      cy.contains('h2', /Create Function|Create Instance/i, { timeout: 15000 }).should('be.visible')

      // Fill name
      cy.get(selectors.functionsInstance.nameInput, { timeout: 10000 })
        .clear()
        .type(instanceName)

      // Select an edge function from dropdown
      cy.get(selectors.functionsInstance.edgeFunctionsDropdown, { timeout: 10000 }).click()

      // Wait for dropdown to load and select first option
      cy.get('li[role="option"]', { timeout: 15000 }).first().click()

      // Save
      cy.get(selectors.formActions.saveButton).click()

      // Wait for API call
      cy.wait('@createFunctionInstance', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 201, 202])

      // Verify drawer closes
      cy.contains('h2', /Create Function|Create Instance/i, { timeout: 15000 }).should('not.exist')

      // Verify function instance appears in list
      cy.contains(instanceName, { timeout: 15000 }).should('exist')
    })

    it('should show validation error for missing edge function', () => {
      navigateToFunctionsTab()
      getCreateButton().click()

      cy.contains('h2', /Create Function|Create Instance/i, { timeout: 15000 }).should('be.visible')

      // Fill only name, don't select function
      cy.get(selectors.functionsInstance.nameInput, { timeout: 10000 })
        .clear()
        .type('TestValidation')

      // Try to submit
      cy.get(selectors.formActions.saveButton).click()

      // Should show validation error (function is required)
      cy.get('.p-toast-message-error, [class*="error"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Edit Function Instance', () => {
    it('should open edit drawer when clicking on a function instance', () => {
      const instanceName = generateName('EditTest')

      cy.intercept('POST', '**/functions').as('createFunctionInstance')

      // Create a function instance
      navigateToFunctionsTab()
      getCreateButton().click()

      cy.contains('h2', /Create Function|Create Instance/i, { timeout: 15000 }).should('be.visible')

      cy.get(selectors.functionsInstance.nameInput, { timeout: 10000 })
        .clear()
        .type(instanceName)

      cy.get(selectors.functionsInstance.edgeFunctionsDropdown, { timeout: 10000 }).click()
      cy.get('li[role="option"]', { timeout: 15000 }).first().click()

      cy.get(selectors.formActions.saveButton).click()
      cy.wait('@createFunctionInstance', { timeout: 30000 })

      // Wait for drawer to close
      cy.contains('h2', /Create Function|Create Instance/i, { timeout: 15000 }).should('not.exist')
      cy.wait(2000)

      // Click on the function instance to edit
      cy.contains(instanceName, { timeout: 15000 }).click()

      // Edit drawer should open
      cy.contains('h2', /Edit Function|Edit Instance/i, { timeout: 15000 }).should('be.visible')

      // Name should be pre-filled
      cy.get(selectors.functionsInstance.nameInput)
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

      cy.contains('h2', /Create Function|Create Instance/i, { timeout: 15000 }).should('be.visible')

      cy.get(selectors.functionsInstance.nameInput, { timeout: 10000 })
        .clear()
        .type(originalName)

      cy.get(selectors.functionsInstance.edgeFunctionsDropdown, { timeout: 10000 }).click()
      cy.get('li[role="option"]', { timeout: 15000 }).first().click()

      cy.get(selectors.formActions.saveButton).click()
      cy.wait('@createFunctionInstance', { timeout: 30000 })

      cy.contains('h2', /Create Function|Create Instance/i, { timeout: 15000 }).should('not.exist')
      cy.wait(2000)

      // Edit
      cy.contains(originalName, { timeout: 15000 }).click()

      cy.contains('h2', /Edit Function|Edit Instance/i, { timeout: 15000 }).should('be.visible')

      // Update name
      cy.get(selectors.functionsInstance.nameInput)
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

      cy.contains('h2', /Create Function|Create Instance/i, { timeout: 15000 }).should('be.visible')

      cy.get(selectors.functionsInstance.nameInput, { timeout: 10000 })
        .clear()
        .type(instanceName)

      cy.get(selectors.functionsInstance.edgeFunctionsDropdown, { timeout: 10000 }).click()
      cy.get('li[role="option"]', { timeout: 15000 }).first().click()

      cy.get(selectors.formActions.saveButton).click()
      cy.wait('@createFunctionInstance', { timeout: 30000 })

      // Wait for drawer to close
      cy.contains('h2', /Create Function|Create Instance/i, { timeout: 15000 }).should('not.exist')
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
    })
  })

  describe('Function Instance with Args/JSON', () => {
    it('should create function instance with JSON args if field exists', () => {
      const instanceName = generateName('WithArgs')

      cy.intercept('POST', '**/functions').as('createFunctionInstance')

      navigateToFunctionsTab()
      getCreateButton().click()

      cy.contains('h2', /Create Function|Create Instance/i, { timeout: 15000 }).should('be.visible')

      // Fill name
      cy.get(selectors.functionsInstance.nameInput, { timeout: 10000 })
        .clear()
        .type(instanceName)

      // Select edge function
      cy.get(selectors.functionsInstance.edgeFunctionsDropdown, { timeout: 10000 }).click()
      cy.get('li[role="option"]', { timeout: 15000 }).first().click()

      // If JSON args field exists, fill it
      cy.get('body').then(($body) => {
        const jsonArgsSelector = '[data-testid*="json-args"], .monaco-editor, [data-testid*="args"]'
        if ($body.find(jsonArgsSelector).length) {
          cy.get(jsonArgsSelector).first().then(($el) => {
            if ($el.hasClass('monaco-editor')) {
              // Monaco editor - type in it
              cy.get('.monaco-editor textarea').type('{"key": "value"}', { force: true })
            } else {
              // Regular textarea/input
              cy.wrap($el).clear().type('{"key": "value"}')
            }
          })
        }
      })

      cy.get(selectors.formActions.saveButton).click()

      cy.wait('@createFunctionInstance', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 201, 202])

      cy.contains(instanceName, { timeout: 15000 }).should('exist')
    })
  })

  after(() => {
    // Cleanup: Delete the test application
    if (applicationName) {
      cy.login()
      cy.openProduct('Edge Application')
      cy.get('.p-datatable', { timeout: 30000 }).should('exist')
      cy.get('.p-skeleton', { timeout: 30000 }).should('not.exist')

      tableHelpers.searchAndSubmit(applicationName)

      cy.get('body').then(($body) => {
        if ($body.find(`[data-testid*="list-table-block__column__name"]`).text().includes(applicationName)) {
          cy.get('[data-testid*="list-table-block__column__name"]')
            .contains(applicationName)
            .parents('tr')
            .find(selectors.actions.menuButton)
            .click()

          cy.contains('Delete').click()

          cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
            .clear()
            .type(applicationName)

          cy.get(selectors.deleteDialog.deleteButton).click()
        }
      })
    }
  })
})
