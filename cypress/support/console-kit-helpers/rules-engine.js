/**
 * Rules Engine Helpers
 *
 * Helpers for creating and managing Rules Engine rules in Edge Application and Edge Firewall.
 * These helpers abstract the common patterns for rule creation, making it easier to
 * write integration tests that depend on rules.
 *
 * Usage:
 *   import { rulesEngineHelpers } from '../../support/console-kit-helpers'
 *
 *   // Create a basic rule
 *   rulesEngineHelpers.createRule({ name: 'MyRule', criteriaValue: '/api/*' })
 *
 *   // Create a rule with specific behavior
 *   rulesEngineHelpers.createRuleWithBehavior({
 *     name: 'CacheRule',
 *     behavior: 'Set Cache Policy',
 *     behaviorConfig: { cachePolicyName: 'Default' }
 *   })
 */

import selectors from '../selectors/product-selectors/edge-application'
import { tableHelpers } from './table'

const generateName = (prefix = 'Rule') => `${prefix}_${Date.now()}`

/**
 * Get the create button selector (handles both empty and populated states)
 */
const getCreateButtonSelector = () => {
  return `${selectors.rulesEngine.createButton}, [data-testid="edge-application-rules-engine-list__create-rules-engine__button"]`
}

/**
 * Navigate to Rules Engine tab within an Edge Application
 * Assumes you're already on the Edge Application edit page
 */
const navigateToRulesEngineTab = () => {
  cy.get(selectors.tabs('Rules Engine'), { timeout: 15000 })
    .should('be.visible')
    .click()
  cy.url().should('include', 'rules-engine')
}

/**
 * Open the create rule drawer
 */
const openCreateDrawer = () => {
  cy.get(getCreateButtonSelector(), { timeout: 15000 }).first().click()
  cy.contains('h2', 'Create Rule', { timeout: 15000 }).should('be.visible')
}

/**
 * Fill the basic rule fields (name and criteria)
 * @param {Object} options
 * @param {string} options.name - Rule name
 * @param {string} options.criteriaValue - Value for the criteria (default: '/test')
 * @param {string} options.criteriaOperator - Operator (default: 'is equal')
 * @param {string} options.phase - Phase: 'Request Phase' or 'Response Phase' (default: Request)
 */
const fillBasicRuleFields = ({
  name,
  criteriaValue = '/test',
  criteriaOperator = null,
  phase = null
}) => {
  // Fill name
  cy.get(selectors.rulesEngine.ruleNameInput, { timeout: 10000 })
    .clear()
    .type(name)

  // Select phase if specified
  if (phase) {
    cy.get(selectors.rulesEngine.phaseRadioGroup, { timeout: 10000 })
      .contains(phase)
      .click()
  }

  // Change operator if specified
  if (criteriaOperator) {
    cy.get(selectors.rulesEngine.criteriaOperatorDropdown(0, 0), { timeout: 10000 }).click()
    cy.get(selectors.rulesEngine.criteriaOperatorOption(criteriaOperator), { timeout: 10000 }).click()
  }

  // Fill criteria value (skip for operators that don't need it like 'exists')
  cy.get('body').then(($body) => {
    const criteriaInput = selectors.rulesEngine.criteriaInputValue(0, 0)
    if ($body.find(criteriaInput).length) {
      cy.get(criteriaInput).clear().type(criteriaValue)
    }
  })
}

/**
 * Select a behavior from the dropdown
 * @param {string} behaviorName - The behavior to select (e.g., 'Deliver', 'Deny (403 Forbidden)', 'Set Cache Policy')
 * @param {number} behaviorIndex - Index of the behavior (default: 0)
 */
const selectBehavior = (behaviorName, behaviorIndex = 0) => {
  cy.get(selectors.rulesEngine.behaviorsDropdown(behaviorIndex), { timeout: 10000 }).click()
  cy.get(selectors.rulesEngine.behaviorsOption(behaviorName), { timeout: 10000 }).click()
}

/**
 * Save the rule and verify success
 */
const saveRule = () => {
  cy.get(selectors.formActions.saveButton).click()
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
}

/**
 * Create a basic rule with default Deliver behavior
 * @param {Object} options
 * @param {string} options.name - Rule name (auto-generated if not provided)
 * @param {string} options.criteriaValue - Criteria value (default: '/test')
 * @param {string} options.phase - Phase (default: Request Phase)
 * @returns {string} The rule name
 */
const createRule = ({ name = null, criteriaValue = '/test', phase = null } = {}) => {
  const ruleName = name || generateName('Rule')

  navigateToRulesEngineTab()
  openCreateDrawer()
  fillBasicRuleFields({ name: ruleName, criteriaValue, phase })
  saveRule()

  return ruleName
}

/**
 * Create a rule with a specific behavior
 * @param {Object} options
 * @param {string} options.name - Rule name
 * @param {string} options.behavior - Behavior name (e.g., 'Deny (403 Forbidden)', 'Set Cache Policy')
 * @param {string} options.criteriaValue - Criteria value
 * @param {string} options.phase - Phase
 * @param {Function} options.configureBehavior - Optional callback to configure behavior-specific fields
 * @returns {string} The rule name
 */
const createRuleWithBehavior = ({
  name = null,
  behavior,
  criteriaValue = '/test',
  phase = null,
  configureBehavior = null
} = {}) => {
  const ruleName = name || generateName('Rule')

  navigateToRulesEngineTab()
  openCreateDrawer()
  fillBasicRuleFields({ name: ruleName, criteriaValue, phase })
  selectBehavior(behavior)

  // Execute behavior-specific configuration if provided
  if (configureBehavior) {
    configureBehavior()
  }

  saveRule()

  return ruleName
}

/**
 * Create a rule with Set Cache Policy behavior
 * @param {Object} options
 * @param {string} options.name - Rule name
 * @param {string} options.cachePolicyName - Name of the cache policy to select
 * @param {boolean} options.createNewCachePolicy - Whether to create a new cache policy
 * @param {string} options.criteriaValue - Criteria value
 * @returns {string} The rule name
 */
const createRuleWithCachePolicy = ({
  name = null,
  cachePolicyName = null,
  createNewCachePolicy = false,
  criteriaValue = '/cache/*'
} = {}) => {
  const ruleName = name || generateName('CacheRule')

  navigateToRulesEngineTab()
  openCreateDrawer()
  fillBasicRuleFields({ name: ruleName, criteriaValue })
  selectBehavior('Set Cache Policy')

  if (createNewCachePolicy) {
    // Click create new cache policy button
    cy.get(selectors.rulesEngine.createCachePolicyButton, { timeout: 10000 }).click()

    // Fill cache policy name
    const newCachePolicyName = cachePolicyName || generateName('CachePolicy')
    cy.get(selectors.cacheSettings.nameInput, { timeout: 10000 })
      .clear()
      .type(newCachePolicyName)

    // Save cache policy
    cy.get(selectors.cacheSettings.saveCacheSetting)
      .find(selectors.formActions.saveButton)
      .click()

    cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

    // Select the created cache policy
    cy.get(selectors.rulesEngine.setCachePolicySelect(0), { timeout: 10000 }).click()
    cy.get(selectors.rulesEngine.cachePolicyOption(newCachePolicyName), { timeout: 10000 }).click()
  } else if (cachePolicyName) {
    // Select existing cache policy
    cy.get(selectors.rulesEngine.setCachePolicySelect(0), { timeout: 10000 }).click()
    cy.get(selectors.rulesEngine.cachePolicyOption(cachePolicyName), { timeout: 10000 }).click()
  }

  saveRule()

  return ruleName
}

/**
 * Create a rule with Run Function behavior
 * @param {Object} options
 * @param {string} options.name - Rule name
 * @param {string} options.functionInstanceName - Name of the function instance to select
 * @param {string} options.criteriaValue - Criteria value
 * @returns {string} The rule name
 */
const createRuleWithFunction = ({
  name = null,
  functionInstanceName,
  criteriaValue = '/function/*'
} = {}) => {
  const ruleName = name || generateName('FunctionRule')

  navigateToRulesEngineTab()
  openCreateDrawer()
  fillBasicRuleFields({ name: ruleName, criteriaValue })
  selectBehavior('Run Function')

  if (functionInstanceName) {
    cy.get(selectors.rulesEngine.setFunctionInstanceSelect(0), { timeout: 10000 }).click()
    cy.get(selectors.rulesEngine.functionInstanceOption(functionInstanceName), { timeout: 10000 }).click()
  }

  saveRule()

  return ruleName
}

/**
 * Delete a rule by name
 * @param {string} ruleName - The name of the rule to delete
 */
const deleteRule = (ruleName) => {
  navigateToRulesEngineTab()

  // Find and click delete button
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
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
}

/**
 * Edit an existing rule
 * @param {string} ruleName - The name of the rule to edit
 * @param {Object} newValues - New values to set
 * @param {string} newValues.name - New name
 * @param {string} newValues.criteriaValue - New criteria value
 */
const editRule = (ruleName, { name = null, criteriaValue = null } = {}) => {
  navigateToRulesEngineTab()

  // Click on the rule to open edit drawer
  cy.contains(ruleName, { timeout: 15000 }).click()
  cy.contains('h2', 'Edit Rule', { timeout: 15000 }).should('be.visible')

  if (name) {
    cy.get(selectors.rulesEngine.ruleNameInput)
      .clear()
      .type(name)
  }

  if (criteriaValue) {
    cy.get(selectors.rulesEngine.criteriaInputValue(0, 0))
      .clear()
      .type(criteriaValue)
  }

  saveRule()
}

/**
 * Create an Edge Application (prerequisite for Rules Engine tests)
 * @param {string} name - Application name (auto-generated if not provided)
 * @returns {string} The application name
 */
const createEdgeApplication = (name = null) => {
  const appName = name || generateName('RulesTestApp')

  cy.openProduct('Edge Application')
  cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

  cy.get(selectors.mainSettings.createButton, { timeout: 15000 }).click()
  cy.get(selectors.mainSettings.nameInput, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(appName)

  // Handle v4 form with address field
  cy.get('body').then(($body) => {
    if ($body.find(selectors.mainSettings.addressInput).length) {
      cy.get(selectors.mainSettings.addressInput)
        .clear()
        .type('httpbin.org')
    }
  })

  cy.get(selectors.formActions.saveButton).click()
  cy.url({ timeout: 60000 }).should('not.include', '/create')

  // Navigate to the created application
  cy.openProduct('Edge Application')
  cy.get('.p-datatable', { timeout: 30000 }).should('exist')

  tableHelpers.searchAndSubmit(appName)
  cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
    .contains(appName)
    .click()

  cy.url().should('match', /\/(edge-application|applications)\/edit\/\d+/)

  return appName
}

/**
 * Delete an Edge Application
 * @param {string} appName - The application name to delete
 */
const deleteEdgeApplication = (appName) => {
  cy.openProduct('Edge Application')
  cy.get('.p-datatable', { timeout: 30000 }).should('exist')

  tableHelpers.searchAndSubmit(appName)

  cy.get('body').then(($body) => {
    if ($body.text().includes(appName)) {
      cy.contains(appName)
        .parents('tr')
        .find('[data-testid="data-table-actions-column-body-actions-menu-button"]')
        .click()

      cy.contains('Delete').click()

      cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
        .clear()
        .type(appName)

      cy.get(selectors.deleteDialog.deleteButton).click()
    }
  })
}

export const rulesEngineHelpers = {
  // Navigation
  navigateToRulesEngineTab,
  openCreateDrawer,

  // Rule Creation
  createRule,
  createRuleWithBehavior,
  createRuleWithCachePolicy,
  createRuleWithFunction,

  // Rule Management
  editRule,
  deleteRule,

  // Edge Application (prerequisite)
  createEdgeApplication,
  deleteEdgeApplication,

  // Low-level helpers
  fillBasicRuleFields,
  selectBehavior,
  saveRule,
  generateName
}
