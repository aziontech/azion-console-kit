/**
 * Edge Firewall - Rules Engine Integration Tests
 *
 * API: POST/GET/PATCH/DELETE v4/workspace/firewalls/{id}/request_rules
 * Route: /firewalls/edit/{id}/rulesEngine
 *
 * Prerequisites: Requires an existing Edge Firewall
 * Tests: Create, read, update, delete rules with various behaviors
 *
 * Available Behaviors:
 *   - Deny (403 Forbidden)
 *   - Drop (Close Without Response)
 *   - Set Rate Limit
 *   - Set WAF (requires WAF module)
 *   - Run Function (requires Edge Functions module)
 *   - Set Custom Response
 *   - Tag Event
 *
 * Note: The criteria variable must be selected first before the argument input is enabled.
 * Variables like Request URI, Host, Request Args don't require WAF module.
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/edge-firewall'

const generateName = (prefix = 'Rule') => {
  return `${prefix}-${Date.now()}`
}

describe('Edge Firewall - Rules Engine', { tags: ['@integration', '@edge-firewall', '@rules-engine'] }, () => {
  let firewallName
  let firewallId

  before(() => {
    // Create an Edge Firewall to use for Rules Engine tests
    firewallName = generateName('RulesEngineTestFirewall')

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

    cy.get(selectors.formActions.saveButton).click()

    // Wait for creation to complete - URL should change from /create
    cy.url({ timeout: 30000 }).should('not.include', '/create')

    // Navigate to list and then to the firewall
    cy.openProduct('Edge Firewall')
    cy.get('.p-datatable', { timeout: 30000 }).should('exist')

    // Wait for skeletons
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

    // Wait for list to be ready with extended timeout
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

    // Wait for skeletons
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

  // Helper to navigate to Rules Engine tab
  const navigateToRulesEngineTab = () => {
    cy.get(selectors.rulesEngineTab, { timeout: 15000 }).click()
    // URL can be 'rules-engine' or 'rulesEngine' depending on version
    cy.url().should('match', /rules-engine|rulesEngine/)
  }

  // Helper to get create button
  const getCreateButton = () => {
    const createButtonSelector = `${selectors.createRuleButton}, ${selectors.createRulesEngine}`
    return cy.get(createButtonSelector, { timeout: 15000 }).first()
  }

  // Helper to fill criteria with Request URI variable
  const fillCriteriaWithRequestUri = (value) => {
    // First select the variable
    cy.get(selectors.ruleCriteriaVariableDropdown, { timeout: 10000 }).click()
    cy.get(selectors.ruleCriteriaVariableDropdownRequestUri, { timeout: 10000 }).click()

    // Wait for operator dropdown to be enabled and select first option (is_equal)
    cy.get(selectors.ruleCriteriaOperatorDropdown, { timeout: 10000 }).click()
    cy.get(selectors.ruleCriteriaOperatorFirstOption, { timeout: 10000 }).click()

    // Now fill the argument
    cy.get(selectors.ruleCriteriaInput, { timeout: 10000 })
      .should('not.be.disabled')
      .clear()
      .type(value)
  }

  describe('Rules Engine Tab Navigation', () => {
    it('should navigate to Rules Engine tab', () => {
      navigateToRulesEngineTab()
      cy.url().should('match', /rules-engine|rulesEngine/)
    })

    it('should have create rule button', () => {
      navigateToRulesEngineTab()
      getCreateButton().should('be.visible')
    })
  })

  describe('Create Rule with Deny Behavior', () => {
    it('should open create rule drawer', () => {
      navigateToRulesEngineTab()
      getCreateButton().click()

      // Drawer should open
      cy.contains('h2', /Create Rule/i, { timeout: 15000 }).should('be.visible')

      // Name input should be visible
      cy.get(selectors.ruleNameInput, { timeout: 10000 })
        .should('be.visible')
    })

    it('should create a rule with Deny behavior', () => {
      const ruleName = generateName('DenyRule')

      cy.intercept('POST', '**/request_rules').as('createRule')

      navigateToRulesEngineTab()
      getCreateButton().click()

      // Wait for drawer
      cy.contains('h2', /Create Rule/i, { timeout: 15000 }).should('be.visible')

      // Fill name
      cy.get(selectors.ruleNameInput, { timeout: 10000 })
        .clear()
        .type(ruleName)

      // Fill criteria - must select variable first, then operator, then argument
      fillCriteriaWithRequestUri('/test-deny')

      // Select Deny behavior (first option)
      cy.get(selectors.ruleBehaviorDropdown, { timeout: 10000 }).click()
      cy.get(selectors.ruleBehaviorFirstOption, { timeout: 10000 }).click()

      // Save
      cy.get(selectors.formActions.saveButton).click()

      // Wait for API call
      cy.wait('@createRule', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 201, 202])

      // Verify drawer closes
      cy.contains('h2', /Create Rule/i, { timeout: 15000 }).should('not.exist')

      // Verify rule appears in list
      cy.contains(ruleName, { timeout: 15000 }).should('exist')
    })
  })

  describe('Create Rule with Drop Behavior', () => {
    it('should create a rule with Drop behavior', () => {
      const ruleName = generateName('DropRule')

      cy.intercept('POST', '**/request_rules').as('createRule')

      navigateToRulesEngineTab()
      getCreateButton().click()

      // Wait for drawer
      cy.contains('h2', /Create Rule/i, { timeout: 15000 }).should('be.visible')

      // Fill name
      cy.get(selectors.ruleNameInput, { timeout: 10000 })
        .clear()
        .type(ruleName)

      // Fill criteria
      fillCriteriaWithRequestUri('/test-drop')

      // Select behavior dropdown and choose Drop
      cy.get(selectors.ruleBehaviorDropdown, { timeout: 10000 }).click()
      cy.get('li[role="option"]', { timeout: 10000 })
        .contains('Drop')
        .click()

      // Save
      cy.get(selectors.formActions.saveButton).click()

      // Wait for API call
      cy.wait('@createRule', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 201, 202])

      // Verify rule appears in list
      cy.contains(ruleName, { timeout: 15000 }).should('exist')
    })
  })

  describe('Create Rule with Set Rate Limit Behavior', () => {
    it('should create a rule with Set Rate Limit behavior', () => {
      const ruleName = generateName('RateLimitRule')

      cy.intercept('POST', '**/request_rules').as('createRule')

      navigateToRulesEngineTab()
      getCreateButton().click()

      // Wait for drawer
      cy.contains('h2', /Create Rule/i, { timeout: 15000 }).should('be.visible')

      // Fill name
      cy.get(selectors.ruleNameInput, { timeout: 10000 })
        .clear()
        .type(ruleName)

      // Fill criteria
      fillCriteriaWithRequestUri('/api/')

      // Select Set Rate Limit behavior
      cy.get(selectors.ruleBehaviorDropdown, { timeout: 10000 }).click()
      cy.get('li[role="option"]', { timeout: 10000 })
        .contains('Set Rate Limit')
        .click()

      // Fill rate limit fields - Rate Limit Type
      cy.get(selectors.behaviorRateLimitType, { timeout: 10000 }).scrollIntoView().click()
      cy.get(selectors.behaviorRateLimitTypeFirstOption, { timeout: 10000 }).click()

      // Fill Average Rate Limit
      cy.get(selectors.behaviorAverageRateLimitInput, { timeout: 10000 })
        .scrollIntoView()
        .clear()
        .type('100')

      // Fill Limit By
      cy.get(selectors.behaviorLimitBy, { timeout: 10000 }).scrollIntoView().click()
      cy.get(selectors.behaviorLimitByFirstOption, { timeout: 10000 }).click()

      // Save
      cy.get(selectors.formActions.saveButton).click()

      // Wait for API call
      cy.wait('@createRule', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 201, 202])

      // Verify rule appears in list
      cy.contains(ruleName, { timeout: 15000 }).should('exist')
    })
  })

  describe('Edit Rule', () => {
    it('should open edit drawer when clicking on a rule', () => {
      const ruleName = generateName('EditTest')

      cy.intercept('POST', '**/request_rules').as('createRule')

      // Create a rule first
      navigateToRulesEngineTab()
      getCreateButton().click()

      cy.contains('h2', /Create Rule/i, { timeout: 15000 }).should('be.visible')

      cy.get(selectors.ruleNameInput, { timeout: 10000 })
        .clear()
        .type(ruleName)

      fillCriteriaWithRequestUri('/edit-test')

      cy.get(selectors.ruleBehaviorDropdown, { timeout: 10000 }).click()
      cy.get(selectors.ruleBehaviorFirstOption, { timeout: 10000 }).click()

      cy.get(selectors.formActions.saveButton).click()
      cy.wait('@createRule', { timeout: 30000 })

      // Wait for drawer to close
      cy.contains('h2', /Create Rule/i, { timeout: 15000 }).should('not.exist')
      cy.wait(2000)

      // Click on the rule to edit
      cy.contains(ruleName, { timeout: 15000 }).click()

      // Edit drawer should open
      cy.contains('h2', /Edit Rule/i, { timeout: 15000 }).should('be.visible')

      // Name should be pre-filled
      cy.get(selectors.ruleNameInput)
        .should('have.value', ruleName)
    })

    it('should update rule name', () => {
      const originalName = generateName('OriginalRule')
      const updatedName = generateName('UpdatedRule')

      cy.intercept('POST', '**/request_rules').as('createRule')
      cy.intercept('PATCH', '**/request_rules/**').as('updateRule')

      // Create rule
      navigateToRulesEngineTab()
      getCreateButton().click()

      cy.contains('h2', /Create Rule/i, { timeout: 15000 }).should('be.visible')

      cy.get(selectors.ruleNameInput, { timeout: 10000 })
        .clear()
        .type(originalName)

      fillCriteriaWithRequestUri('/update-test')

      cy.get(selectors.ruleBehaviorDropdown, { timeout: 10000 }).click()
      cy.get(selectors.ruleBehaviorFirstOption, { timeout: 10000 }).click()

      cy.get(selectors.formActions.saveButton).click()
      cy.wait('@createRule', { timeout: 30000 })

      cy.contains('h2', /Create Rule/i, { timeout: 15000 }).should('not.exist')
      cy.wait(3000)

      // Search for the rule we created
      cy.get(selectors.rulesTableSearchInput, { timeout: 10000 })
        .clear()
        .type(originalName)
        .type('{enter}')

      cy.wait(1000)

      // Edit - click on the rule
      cy.contains(originalName, { timeout: 15000 }).click()

      cy.contains('h2', /Edit Rule/i, { timeout: 15000 }).should('be.visible')

      // Update name
      cy.get(selectors.ruleNameInput)
        .clear()
        .type(updatedName)

      cy.get(selectors.formActions.saveButton).click()

      cy.wait('@updateRule', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 202])

      // Wait for drawer to close
      cy.contains('h2', /Edit Rule/i, { timeout: 15000 }).should('not.exist')

      // Clear search and search for updated name
      cy.get(selectors.rulesTableSearchInput, { timeout: 10000 })
        .clear()
        .type(updatedName)
        .type('{enter}')

      cy.wait(2000)

      // Verify updated name in list
      cy.contains(updatedName, { timeout: 15000 }).should('exist')
    })
  })

  describe('Delete Rule', () => {
    it('should delete a rule', () => {
      const ruleName = generateName('ToDelete')

      cy.intercept('POST', '**/request_rules').as('createRule')
      cy.intercept('DELETE', '**/request_rules/**').as('deleteRule')

      // Create rule to delete
      navigateToRulesEngineTab()
      getCreateButton().click()

      cy.contains('h2', /Create Rule/i, { timeout: 15000 }).should('be.visible')

      cy.get(selectors.ruleNameInput, { timeout: 10000 })
        .clear()
        .type(ruleName)

      fillCriteriaWithRequestUri('/to-delete')

      cy.get(selectors.ruleBehaviorDropdown, { timeout: 10000 }).click()
      cy.get(selectors.ruleBehaviorFirstOption, { timeout: 10000 }).click()

      cy.get(selectors.formActions.saveButton).click()
      cy.wait('@createRule', { timeout: 30000 })

      // Wait for drawer to close
      cy.contains('h2', /Create Rule/i, { timeout: 15000 }).should('not.exist')
      cy.wait(2000)

      // Find and delete
      cy.contains(ruleName, { timeout: 30000 })
        .parents('tr')
        .find('[data-testid="data-table-actions-column-body-action-button"], .pi-trash')
        .first()
        .click()

      // Confirm deletion
      cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
        .clear()
        .type(ruleName)

      cy.get(selectors.deleteDialog.deleteButton).click()

      // Wait for delete API call
      cy.wait('@deleteRule', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 202, 204])

      // Verify success
      cy.get('.p-toast-message-success, .p-toast-message-info', { timeout: 10000 }).should('exist')
    })
  })

  describe('Criteria with Starts With Operator', () => {
    it('should create a rule using starts_with operator', () => {
      const ruleName = generateName('StartsWithRule')

      cy.intercept('POST', '**/request_rules').as('createRule')

      navigateToRulesEngineTab()
      getCreateButton().click()

      cy.contains('h2', /Create Rule/i, { timeout: 15000 }).should('be.visible')

      // Fill name
      cy.get(selectors.ruleNameInput, { timeout: 10000 })
        .clear()
        .type(ruleName)

      // Select Request URI variable
      cy.get(selectors.ruleCriteriaVariableDropdown, { timeout: 10000 }).click()
      cy.get(selectors.ruleCriteriaVariableDropdownRequestUri, { timeout: 10000 }).click()

      // Select starts_with operator
      cy.get(selectors.ruleCriteriaOperatorDropdown, { timeout: 10000 }).click()
      cy.get(selectors.ruleCriteriaOperatorStartsWith, { timeout: 10000 }).click()

      // Fill criteria value
      cy.get(selectors.ruleCriteriaInput, { timeout: 10000 })
        .should('not.be.disabled')
        .clear()
        .type('/api')

      // Select behavior
      cy.get(selectors.ruleBehaviorDropdown, { timeout: 10000 }).click()
      cy.get(selectors.ruleBehaviorFirstOption, { timeout: 10000 }).click()

      // Save
      cy.get(selectors.formActions.saveButton).click()

      cy.wait('@createRule', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 201, 202])

      cy.contains(ruleName, { timeout: 15000 }).should('exist')
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
