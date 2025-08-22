/* eslint-disable cypress/no-unnecessary-waiting */
import generateUniqueName from '../../../support/utils'
import selectors from '../../../support/selectors'

let fixtures = {}

/**
 * Creates a new edge application with basic settings.
 */
const createEdgeApplicationCase = () => {
  // Act
  cy.get(selectors.edgeApplication.mainSettings.createButton).click()
  cy.get(selectors.edgeApplication.mainSettings.nameInput).type(fixtures.edgeApplicationName)
  cy.intercept('POST', '/v4/workspace/applications*').as('createEdgeApp')
  cy.get(selectors.form.actionsSubmitButton).click()
  cy.wait('@createEdgeApp')
  cy.verifyToast('success', 'Your edge application has been created')

  // Assert - Verify the edge application was created
  cy.get(selectors.list.searchInput).type(`${fixtures.edgeApplicationName}{enter}`)
  cy.get(selectors.list.filteredRow.column('name')).should(
    'have.text',
    fixtures.edgeApplicationName
  )

  // Act - Navigate to the created edge application
  cy.get(selectors.list.filteredRow.column('name')).click()
}

const createFunctionCase = () => {
  // Act
  cy.get(selectors.functions.nameInput).clear()
  cy.get(selectors.functions.nameInput).type(fixtures.functionName, { delay: 0 })
  cy.intercept('GET', '/v4/edge_functions/functions/*').as('getFunctions2')
  cy.get(selectors.edgeApplication.functionsInstance.edgeFunctionActionbar)
    .find(selectors.functions.saveButton)
    .click()
  cy.verifyToast('success', 'Your edge function has been created')
  cy.wait('@getFunctions2')
}

describe('Edge Application', { tags: ['@dev3'] }, () => {
  beforeEach(() => {
    fixtures.edgeApplicationName = generateUniqueName('EdgeApp')
    cy.intercept('GET', '/api/account/info', {
      fixture: '/account/info/without_flags.json'
    }).as('accountInfo')
    // Login
    cy.login()

    fixtures = {
      functionName: generateUniqueName('EdgeFunction'),
      functionInstanceName: generateUniqueName('FunctionsInstance'),
      edgeApplicationName: generateUniqueName('EdgeApp'),
      originName: generateUniqueName('origin'),
      rulesEngineName: generateUniqueName('RulesEng'),
      cacheSettingName: generateUniqueName('cacheSetting')
    }
  })

  it('should create a rule engine set cache policy', () => {
    // Arrange
    cy.openProduct('Edge Application')
    createEdgeApplicationCase()
    cy.get(selectors.edgeApplication.mainSettings.modulesSwitch('edgeFunctionsEnabled')).click()
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your edge application has been updated')
    cy.get(selectors.edgeApplication.tabs('Rules Engine')).click()

    // Act
    // Create a rule
    cy.get(selectors.edgeApplication.rulesEngine.createButton).click()
    cy.get(selectors.edgeApplication.rulesEngine.ruleNameInput).type(fixtures.rulesEngineName)
    cy.get(selectors.edgeApplication.rulesEngine.criteriaOperatorDropdown(0, 0)).click()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaOperatorOption('is equal')).click()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaInputValue(0, 0)).clear()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaInputValue(0, 0)).type('/')
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsDropdown(0)).click()
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsOption('Run Function')).click()
    cy.get(selectors.edgeApplication.rulesEngine.setFunctionInstanceSelect(0)).click()
    cy.intercept('GET', '/v4/edge_functions/functions*').as('getFunctions')
    cy.get(selectors.edgeApplication.rulesEngine.createFunctionInstanceButton).click()
    cy.get(selectors.edgeApplication.functionsInstance.nameInput).clear()
    cy.get(selectors.edgeApplication.functionsInstance.nameInput).type(
      fixtures.functionInstanceName
    )
    cy.wait('@getFunctions')
    cy.get(selectors.edgeApplication.functionsInstance.edgeFunctionsDropdown).click()
    cy.get(selectors.edgeApplication.functionsInstance.createFunctionButton).click()
    createFunctionCase()
    cy.intercept('POST', '/v4/workspace/applications/*/rules*').as('postFunction')
    cy.get(selectors.edgeApplication.rulesEngine.functionInstanceActionBar)
      .find(selectors.form.actionsSubmitButton)
      .click()
    cy.intercept(
      'GET',
      '/v4/workspace/applications/*/functions?*'
    ).as('getFunctionInstance')

    cy.wait('@getFunctionInstance')
    cy.get(selectors.edgeApplication.rulesEngine.setFunctionInstanceSelect(0)).click()
    cy.get(selectors.edgeApplication.rulesEngine.firstBehaviorValueOption).click()

    cy.get(selectors.form.actionsSubmitButton).click()
    cy.wait('@postFunction')
    cy.verifyToast('success', 'Rule successfully created')

    // Assert
    cy.get(selectors.list.searchInput).type(`${fixtures.rulesEngineName}{enter}`)
    cy.get(selectors.list.filteredRow.column('name')).should('have.text', fixtures.rulesEngineName)
  })
})