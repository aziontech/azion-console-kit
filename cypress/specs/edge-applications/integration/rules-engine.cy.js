/**
 * Edge Applications - Rules Engine Integration Tests
 *
 * API: POST v4/workspace/applications/{id}/rules_engine
 * Route: /edge-application/edit/{id}/rules-engine
 *
 * Prerequisites: Requires an existing Edge Application
 * Tests: Create, edit, delete rules for Request and Response phases
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/edge-application'

const generateName = (prefix = 'Rule') => {
  return `${prefix}_${Date.now()}`
}

describe('Edge Applications - Rules Engine', { tags: ['@integration', '@edge-applications', '@rules-engine'] }, () => {
  let applicationName
  let applicationId

  before(() => {
    // Create an Edge Application to use for Rules Engine tests
    applicationName = generateName('RulesEngineTestApp')

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

    // Wait for creation to complete - URL should change from /create
    cy.url({ timeout: 30000 }).should('not.include', '/create')

    // After creation, navigate to list and then to the application
    cy.openProduct('Edge Application')
    cy.get('.p-datatable', { timeout: 30000 }).should('exist')

    tableHelpers.searchAndSubmit(applicationName)
    cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
      .contains(applicationName)
      .click()

    // Now we should be on the edit page - extract the ID
    cy.url().should('match', /\/(edge-application|applications)\/edit\/\d+/)
    cy.url().then((url) => {
      const match = url.match(/edit\/(\d+)/)
      if (match) {
        applicationId = match[1]
      }
    })

    // Enable Application Accelerator module for advanced features (multiple criteria, behaviors)
    // First navigate to Main Settings tab
    cy.get(selectors.tabs('Main Settings'), { timeout: 15000 }).click()
    cy.wait(2000) // Wait for form to load

    // Try to enable Application Accelerator (may have different testid depending on version)
    const appAcceleratorSelector = '[data-testid*="applicationAccelerator"] .p-inputswitch-slider, [data-testid*="application-accelerator"] .p-inputswitch-slider'
    cy.get('body').then(($body) => {
      if ($body.find(appAcceleratorSelector).length) {
        cy.get(appAcceleratorSelector).first().then(($switch) => {
          const parentSwitch = $switch.closest('.p-inputswitch')
          if (parentSwitch && !parentSwitch.hasClass('p-inputswitch-checked')) {
            cy.wrap($switch).click()
            cy.get(selectors.formActions.saveButton).click()
            cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
            // Dismiss the toast by clicking it or waiting for it to disappear
            cy.wait(3000)
          }
        })
      }
    })

    // Create a Cache Policy for Set Cache Policy tests
    cy.get(selectors.tabs('Cache Settings'), { timeout: 15000 }).click()
    cy.wait(3000) // Wait for tab to fully load

    // Wait for either create button or empty state
    cy.get(`${selectors.cacheSettings.createButton}, [data-testid*="empty"]`, { timeout: 15000 }).should('exist')

    // Click create button
    cy.get(selectors.cacheSettings.createButton, { timeout: 15000 }).first().click()

    // Wait for drawer to open (title is "Create Cache Settings")
    cy.contains('h2', 'Create Cache Settings', { timeout: 15000 }).should('be.visible')

    // Fill in cache policy name (use hyphen instead of underscore - validation requires ^[a-zA-Z0-9 \-\.\'\\:\(\)\[\]]+$)
    const cachePolicyName = `TestCachePolicy-${Date.now()}`
    cy.get(selectors.cacheSettings.nameInput, { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type(cachePolicyName)

    // Click save button in the drawer action bar
    cy.get(selectors.formActions.saveButton, { timeout: 10000 }).click()

    // Wait for success (either toast appears or drawer closes - both indicate success)
    cy.get('.p-toast-message-success, .p-toast-message-info', { timeout: 30000 }).should('exist')

    // Wait for drawer to close
    cy.contains('h2', 'Create Cache Settings', { timeout: 15000 }).should('not.exist')
    cy.wait(2000) // Wait for state to update

  })

  beforeEach(() => {
    cy.login()
    // Navigate to the created application
    cy.openProduct('Edge Application')

    // Wait for list to be ready with extended timeout for slow API
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

    // Wait for skeletons to disappear (extended timeout for slow API)
    cy.get('.p-skeleton', { timeout: 30000 }).should('not.exist')

    tableHelpers.searchAndSubmit(applicationName)
    cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
      .contains(applicationName)
      .click()

    // Wait for edit page to load
    cy.url().should('match', /\/(edge-application|applications)\/edit\/\d+/)
  })

  // Helper to get create button (handles both empty and populated states)
  const getCreateButton = () => {
    const createButtonSelector = `${selectors.rulesEngine.createButton}, [data-testid="edge-application-rules-engine-list__create-rules-engine__button"]`
    return cy.get(createButtonSelector, { timeout: 15000 }).first()
  }

  describe('Rules Engine Tab Navigation', () => {
    it('should navigate to Rules Engine tab', () => {
      cy.get(selectors.tabs('Rules Engine'), { timeout: 15000 })
        .should('be.visible')
        .click()

      // Verify we're on the rules engine tab
      cy.url().should('include', 'rules-engine')
    })

    it('should have create rule button', () => {
      cy.get(selectors.tabs('Rules Engine'), { timeout: 15000 }).click()

      getCreateButton().should('be.visible')
    })
  })

  describe('Create Request Phase Rule', () => {
    it('should open create rule drawer', () => {
      cy.get(selectors.tabs('Rules Engine'), { timeout: 15000 }).click()
      getCreateButton().click()

      // Drawer should open - verify by title
      cy.contains('h2', 'Create Rule', { timeout: 15000 }).should('be.visible')

      // Name input should be visible
      cy.get(selectors.rulesEngine.ruleNameInput, { timeout: 10000 })
        .should('be.visible')
    })

    it('should create a basic request phase rule with Deliver behavior', () => {
      const ruleName = generateName('RequestDeliverRule')

      cy.get(selectors.tabs('Rules Engine'), { timeout: 15000 }).click()
      getCreateButton().click()

      // Wait for drawer
      cy.contains('h2', 'Create Rule', { timeout: 15000 }).should('be.visible')

      // Fill name
      cy.get(selectors.rulesEngine.ruleNameInput, { timeout: 10000 })
        .clear()
        .type(ruleName)

      // Phase should default to Request - verify radio is selected
      cy.get(selectors.rulesEngine.phaseRadioGroup, { timeout: 10000 })
        .should('be.visible')

      // Criteria - default is ${uri} is_equal
      // Just fill the argument
      cy.get(selectors.rulesEngine.criteriaInputValue(0, 0), { timeout: 10000 })
        .clear()
        .type('/test-path')

      // Behavior - default is Deliver, keep it

      // Save
      cy.get(selectors.formActions.saveButton).click()

      // Verify success
      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')

      // Verify rule appears in list
      cy.contains(ruleName, { timeout: 15000 }).should('exist')
    })

    it('should create a rule with Deny behavior', () => {
      const ruleName = generateName('DenyRule')

      cy.get(selectors.tabs('Rules Engine'), { timeout: 15000 }).click()
      getCreateButton().click()

      cy.contains('h2', 'Create Rule', { timeout: 15000 }).should('be.visible')

      // Fill name
      cy.get(selectors.rulesEngine.ruleNameInput, { timeout: 10000 })
        .clear()
        .type(ruleName)

      // Fill criteria argument
      cy.get(selectors.rulesEngine.criteriaInputValue(0, 0), { timeout: 10000 })
        .clear()
        .type('/blocked-path')

      // Change behavior to Deny
      cy.get(selectors.rulesEngine.behaviorsDropdown(0), { timeout: 10000 }).click()
      cy.get(selectors.rulesEngine.behaviorsOption('Deny (403 Forbidden)'), { timeout: 10000 }).click()

      // Save
      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')

      cy.contains(ruleName, { timeout: 15000 }).should('exist')
    })
  })

  describe('Create Response Phase Rule', () => {
    it('should create a response phase rule', () => {
      const ruleName = generateName('ResponseRule')

      cy.get(selectors.tabs('Rules Engine'), { timeout: 15000 }).click()
      getCreateButton().click()

      cy.contains('h2', 'Create Rule', { timeout: 15000 }).should('be.visible')

      // Fill name
      cy.get(selectors.rulesEngine.ruleNameInput, { timeout: 10000 })
        .clear()
        .type(ruleName)

      // Select Response phase
      cy.get(selectors.rulesEngine.phaseRadioGroup, { timeout: 10000 })
        .contains('Response Phase')
        .click()

      // Fill criteria argument
      cy.get(selectors.rulesEngine.criteriaInputValue(0, 0), { timeout: 10000 })
        .clear()
        .type('/api/*')

      // Keep default Deliver behavior

      // Save
      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')
    })
  })

  describe('Edit Rule', () => {
    it('should open edit drawer when clicking on a rule', () => {
      const ruleName = generateName('EditTestRule')

      // First create a rule to edit
      cy.get(selectors.tabs('Rules Engine'), { timeout: 15000 }).click()
      getCreateButton().click()

      cy.contains('h2', 'Create Rule', { timeout: 15000 }).should('be.visible')

      cy.get(selectors.rulesEngine.ruleNameInput, { timeout: 10000 })
        .clear()
        .type(ruleName)

      cy.get(selectors.rulesEngine.criteriaInputValue(0, 0), { timeout: 10000 })
        .clear()
        .type('/edit-test')

      cy.get(selectors.formActions.saveButton).click()
      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

      // Now click on the rule to edit
      cy.contains(ruleName, { timeout: 15000 }).click()

      // Edit drawer should open - verify by title
      cy.contains('h2', 'Edit Rule', { timeout: 15000 }).should('be.visible')

      // Name should be pre-filled
      cy.get(selectors.rulesEngine.ruleNameInput)
        .should('have.value', ruleName)
    })

    it('should update rule name', () => {
      const originalName = generateName('OriginalRule')
      const updatedName = generateName('UpdatedRule')

      // Create rule
      cy.get(selectors.tabs('Rules Engine'), { timeout: 15000 }).click()
      getCreateButton().click()

      cy.contains('h2', 'Create Rule', { timeout: 15000 }).should('be.visible')

      cy.get(selectors.rulesEngine.ruleNameInput, { timeout: 10000 })
        .clear()
        .type(originalName)

      cy.get(selectors.rulesEngine.criteriaInputValue(0, 0), { timeout: 10000 })
        .clear()
        .type('/original')

      cy.get(selectors.formActions.saveButton).click()
      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

      // Click to edit
      cy.contains(originalName, { timeout: 15000 }).click()

      cy.contains('h2', 'Edit Rule', { timeout: 15000 }).should('be.visible')

      // Update name
      cy.get(selectors.rulesEngine.ruleNameInput)
        .clear()
        .type(updatedName)

      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')

      // Verify updated name in list
      cy.contains(updatedName, { timeout: 15000 }).should('exist')
    })
  })

  describe('Delete Rule', () => {
    it('should delete a rule', () => {
      const ruleName = generateName('DeleteTestRule')

      // Intercept the create request
      cy.intercept('POST', '**/request_rules').as('createRule')

      // Create rule to delete
      cy.get(selectors.tabs('Rules Engine'), { timeout: 15000 }).click()
      getCreateButton().click()

      cy.contains('h2', 'Create Rule', { timeout: 15000 }).should('be.visible')

      cy.get(selectors.rulesEngine.ruleNameInput, { timeout: 10000 })
        .clear()
        .type(ruleName)

      cy.get(selectors.rulesEngine.criteriaInputValue(0, 0), { timeout: 10000 })
        .clear()
        .type('/to-delete')

      cy.get(selectors.formActions.saveButton).click()

      // Wait for API call to complete
      cy.wait('@createRule', { timeout: 30000 }).its('response.statusCode').should('be.oneOf', [200, 201, 202])

      // Wait for drawer to close completely
      cy.contains('h2', 'Create Rule', { timeout: 15000 }).should('not.exist')
      cy.wait(2000)

      // Find the rule row and click delete button (direct action, not menu)
      cy.contains(ruleName, { timeout: 30000 })
        .parents('tr')
        .find('[data-testid="data-table-actions-column-body-action-button"], .pi-trash')
        .first()
        .click()

      // Intercept the delete request
      cy.intercept('DELETE', '**/request_rules/**').as('deleteRule')

      // Confirm deletion by typing the rule name
      cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
        .clear()
        .type(ruleName)

      cy.get(selectors.deleteDialog.deleteButton).click()

      // Wait for delete API call to complete
      cy.wait('@deleteRule', { timeout: 30000 }).its('response.statusCode').should('be.oneOf', [200, 202, 204])
    })
  })

  describe('Behaviors - Set Cache Policy', () => {
    it('should create a rule with Set Cache Policy behavior selecting existing cache', () => {
      const ruleName = generateName('CachePolicyRule')

      cy.get(selectors.tabs('Rules Engine'), { timeout: 15000 }).click()
      getCreateButton().click()

      cy.contains('h2', 'Create Rule', { timeout: 15000 }).should('be.visible')

      // Fill name
      cy.get(selectors.rulesEngine.ruleNameInput, { timeout: 10000 })
        .clear()
        .type(ruleName)

      // Fill criteria
      cy.get(selectors.rulesEngine.criteriaInputValue(0, 0), { timeout: 10000 })
        .clear()
        .type('/static/*')

      // Select Set Cache Policy behavior
      cy.get(selectors.rulesEngine.behaviorsDropdown(0), { timeout: 10000 }).click()
      cy.get(selectors.rulesEngine.behaviorsOption('Set Cache Policy'), { timeout: 10000 }).click()

      // Wait for cache policy dropdown to load and select first option
      cy.get(selectors.rulesEngine.setCachePolicySelect(0), { timeout: 10000 }).click()
      // Wait for options to load (they have IDs like behaviors[0].cacheId_0, behaviors[0].cacheId_1, etc)
      cy.get('li[id*="cacheId_"]', { timeout: 15000 }).first().click()

      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')

      cy.contains(ruleName, { timeout: 15000 }).should('exist')
    })
  })

  describe('Behaviors - No Content (204)', () => {
    it('should create a rule with No Content (204) behavior', () => {
      const ruleName = generateName('NoContentRule')

      cy.get(selectors.tabs('Rules Engine'), { timeout: 15000 }).click()
      getCreateButton().click()

      cy.contains('h2', 'Create Rule', { timeout: 15000 }).should('be.visible')

      // Fill name
      cy.get(selectors.rulesEngine.ruleNameInput, { timeout: 10000 })
        .clear()
        .type(ruleName)

      // Fill criteria
      cy.get(selectors.rulesEngine.criteriaInputValue(0, 0), { timeout: 10000 })
        .clear()
        .type('/no-content/*')

      // Select No Content (204) behavior
      cy.get(selectors.rulesEngine.behaviorsDropdown(0), { timeout: 10000 }).click()
      cy.get(selectors.rulesEngine.behaviorsOption('No Content (204)'), { timeout: 10000 }).click()

      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')

      cy.contains(ruleName, { timeout: 15000 }).should('exist')
    })
  })

  describe('Behaviors - Redirect', () => {
    it('should create a rule with Redirect To (301 Moved Permanently) behavior', () => {
      const ruleName = generateName('Redirect301Rule')

      cy.get(selectors.tabs('Rules Engine'), { timeout: 15000 }).click()
      getCreateButton().click()

      cy.contains('h2', 'Create Rule', { timeout: 15000 }).should('be.visible')

      // Fill name
      cy.get(selectors.rulesEngine.ruleNameInput, { timeout: 10000 })
        .clear()
        .type(ruleName)

      // Fill criteria
      cy.get(selectors.rulesEngine.criteriaInputValue(0, 0), { timeout: 10000 })
        .clear()
        .type('/old-path')

      // Select Redirect To (301 Moved Permanently) behavior
      cy.get(selectors.rulesEngine.behaviorsDropdown(0), { timeout: 10000 }).click()
      cy.get(selectors.rulesEngine.behaviorsOption('Redirect To (301 Moved Permanently)'), { timeout: 10000 }).click()

      // Fill redirect URL (location/target field)
      // FieldText adds __input suffix to data-testid
      cy.get('[data-testid="edge-application-rule-form__behaviors-item-target[0]__input"]', { timeout: 10000 })
        .clear()
        .type('https://example.com/new-path')

      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')

      cy.contains(ruleName, { timeout: 15000 }).should('exist')
    })

    it('should create a rule with Redirect To (302 Found) behavior', () => {
      const ruleName = generateName('Redirect302Rule')

      cy.get(selectors.tabs('Rules Engine'), { timeout: 15000 }).click()
      getCreateButton().click()

      cy.contains('h2', 'Create Rule', { timeout: 15000 }).should('be.visible')

      // Fill name
      cy.get(selectors.rulesEngine.ruleNameInput, { timeout: 10000 })
        .clear()
        .type(ruleName)

      // Fill criteria
      cy.get(selectors.rulesEngine.criteriaInputValue(0, 0), { timeout: 10000 })
        .clear()
        .type('/temp-redirect')

      // Select Redirect To (302 Found) behavior
      cy.get(selectors.rulesEngine.behaviorsDropdown(0), { timeout: 10000 }).click()
      cy.get(selectors.rulesEngine.behaviorsOption('Redirect To (302 Found)'), { timeout: 10000 }).click()

      // Fill redirect URL (location/target field)
      // FieldText adds __input suffix to data-testid
      cy.get('[data-testid="edge-application-rule-form__behaviors-item-target[0]__input"]', { timeout: 10000 })
        .clear()
        .type('https://example.com/temporary')

      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')

      cy.contains(ruleName, { timeout: 15000 }).should('exist')
    })
  })

  describe('Multiple Criteria and Behaviors', () => {
    it('should create a rule with multiple criteria using AND', () => {
      const ruleName = generateName('MultiCriteriaRule')

      cy.get(selectors.tabs('Rules Engine'), { timeout: 15000 }).click()
      getCreateButton().click()

      cy.contains('h2', 'Create Rule', { timeout: 15000 }).should('be.visible')

      // Fill name
      cy.get(selectors.rulesEngine.ruleNameInput, { timeout: 10000 })
        .clear()
        .type(ruleName)

      // Fill first criteria
      cy.get(selectors.rulesEngine.criteriaInputValue(0, 0), { timeout: 10000 })
        .clear()
        .type('/api/*')

      // Add AND condition (requires Application Accelerator enabled in before())
      cy.get(selectors.rulesEngine.criteriaConditionalButton('And'), { timeout: 10000 }).click()

      // Fill second criteria (should appear as index [0][1])
      cy.get(selectors.rulesEngine.criteriaInputValue(0, 1), { timeout: 10000 })
        .clear()
        .type('/v1/*')

      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')

      cy.contains(ruleName, { timeout: 15000 }).should('exist')
    })

    it('should create a rule with multiple behaviors', () => {
      const ruleName = generateName('MultiBehaviorRule')

      cy.get(selectors.tabs('Rules Engine'), { timeout: 15000 }).click()
      getCreateButton().click()

      cy.contains('h2', 'Create Rule', { timeout: 15000 }).should('be.visible')

      // Fill name
      cy.get(selectors.rulesEngine.ruleNameInput, { timeout: 10000 })
        .clear()
        .type(ruleName)

      // Fill criteria
      cy.get(selectors.rulesEngine.criteriaInputValue(0, 0), { timeout: 10000 })
        .clear()
        .type('/multi/*')

      // First behavior: Change from Deliver to Add Request Header (Deliver disables Add Behavior button)
      cy.get(selectors.rulesEngine.behaviorsDropdown(0), { timeout: 10000 }).click()
      cy.get(selectors.rulesEngine.behaviorsOption('Add Request Header'), { timeout: 10000 }).click()

      // Fill target field with format "header-name: value" (single field)
      // FieldText adds __input suffix to data-testid
      cy.get('[data-testid="edge-application-rule-form__behaviors-item-target[0]__input"]', { timeout: 10000 })
        .clear()
        .type('X-First-Header: first-value')

      // Add second behavior (requires Application Accelerator enabled in before())
      cy.get(selectors.rulesEngine.behaviorsAddButton, { timeout: 10000 }).click()

      // Second behavior: Add another Request Header
      cy.get(selectors.rulesEngine.behaviorsDropdown(1), { timeout: 10000 }).click()
      cy.get(selectors.rulesEngine.behaviorsOption('Add Request Header'), { timeout: 10000 }).click()

      // Fill target field with format "header-name: value" (single field)
      cy.get('[data-testid="edge-application-rule-form__behaviors-item-target[1]__input"]', { timeout: 10000 })
        .clear()
        .type('X-Second-Header: second-value')

      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')

      cy.contains(ruleName, { timeout: 15000 }).should('exist')
    })
  })

  describe('Criteria Operators', () => {
    it('should support "starts with" operator', () => {
      const ruleName = generateName('StartsWithRule')

      cy.get(selectors.tabs('Rules Engine'), { timeout: 15000 }).click()
      getCreateButton().click()

      cy.contains('h2', 'Create Rule', { timeout: 15000 }).should('be.visible')

      cy.get(selectors.rulesEngine.ruleNameInput, { timeout: 10000 })
        .clear()
        .type(ruleName)

      // Change operator to "starts with"
      cy.get(selectors.rulesEngine.criteriaOperatorDropdown(0, 0), { timeout: 10000 }).click()
      cy.get(selectors.rulesEngine.criteriaOperatorOption('starts with'), { timeout: 10000 }).click()

      // Fill criteria value
      cy.get(selectors.rulesEngine.criteriaInputValue(0, 0), { timeout: 10000 })
        .clear()
        .type('/api/')

      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')
    })

    it('should support "exists" operator without argument', () => {
      const ruleName = generateName('ExistsRule')

      cy.get(selectors.tabs('Rules Engine'), { timeout: 15000 }).click()
      getCreateButton().click()

      cy.contains('h2', 'Create Rule', { timeout: 15000 }).should('be.visible')

      cy.get(selectors.rulesEngine.ruleNameInput, { timeout: 10000 })
        .clear()
        .type(ruleName)

      // Change operator to "exists" (using default ${uri} variable)
      cy.get(selectors.rulesEngine.criteriaOperatorDropdown(0, 0), { timeout: 10000 }).click()
      cy.get(selectors.rulesEngine.criteriaOperatorOption('exists'), { timeout: 10000 }).click()

      // Argument input should not be required/visible for "exists" operator
      cy.get(selectors.rulesEngine.criteriaInputValue(0, 0)).should('not.exist')

      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')
    })
  })

  after(() => {
    // Cleanup: Delete the test application
    if (applicationName) {
      cy.login()
      cy.openProduct('Edge Application')
      cy.get('.p-datatable', { timeout: 30000 }).should('exist')

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
