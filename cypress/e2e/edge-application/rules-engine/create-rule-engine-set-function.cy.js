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
  cy.get(selectors.edgeApplication.mainSettings.addressInput).clear()
  cy.get(selectors.edgeApplication.mainSettings.addressInput).type('httpbingo.org')
  cy.get(selectors.form.actionsSubmitButton).click()
  cy.verifyToast('success', 'Your edge application has been created')
  cy.get(selectors.form.actionsCancelButton).click()

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
  cy.intercept('GET', 'api/v3/edge_functions*').as('getEdgeFunctions')
  cy.get(selectors.edgeApplication.functionsInstance.edgeFunctionActionbar)
    .find(selectors.functions.saveButton)
    .click()
  cy.verifyToast('success', 'Your edge function has been created')
  cy.wait('@getEdgeFunctions')
}

// TODO: remove xfail tag when the API v4 is fixed
describe('Edge Application', { tags: ['@dev3', '@xfail'] }, () => {
  beforeEach(() => {
    fixtures.edgeApplicationName = generateUniqueName('EdgeApp')
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
    cy.get(selectors.edgeApplication.mainSettings.modulesSwitch('edgeFunctions')).click()
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
    cy.get(selectors.edgeApplication.rulesEngine.createFunctionInstanceButton).click()
    cy.get(selectors.edgeApplication.functionsInstance.nameInput).clear()
    cy.get(selectors.edgeApplication.functionsInstance.nameInput).type(
      fixtures.functionInstanceName
    )
    cy.get(selectors.edgeApplication.functionsInstance.edgeFunctionsDropdown).click()
    cy.get(selectors.edgeApplication.functionsInstance.createFunctionButton).click()
    createFunctionCase()
    cy.intercept('POST', 'api/v3/edge_applications/*/functions_instances*').as('postFunction')
    cy.get(selectors.edgeApplication.rulesEngine.functionInstanceActionBar)
      .find(selectors.form.actionsSubmitButton)
      .click()
    cy.intercept(
      'GET',
      'api/v3/edge_applications/*/functions_instances?order_by=id&sort=asc&page=1&page_size=200'
    ).as('getFunctionInstance')
    cy.wait('@postFunction')
    cy.wait('@getFunctionInstance')
    cy.wait(3000)
    cy.get(selectors.edgeApplication.rulesEngine.setFunctionInstanceSelect(0)).click()
    cy.get(selectors.edgeApplication.rulesEngine.setFunctionInstanceSelect(0))
      .find(
        selectors.edgeApplication.rulesEngine.functionInstanceOption(fixtures.functionInstanceName)
      )
      .click()

    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your Rules Engine has been created.')

    // Assert
    cy.get(selectors.list.searchInput).type(`${fixtures.rulesEngineName}{enter}`)
    cy.get(selectors.list.filteredRow.column('name')).should('have.text', fixtures.rulesEngineName)

    // Cleanup - Remove the rule engine
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('Rule successfully deleted')
    })
  })

  afterEach(() => {
    // Delete the edge application
    cy.deleteEntityFromList({
      entityName: fixtures.edgeApplicationName,
      productName: 'Edge Application'
    }).then(() => {
      cy.verifyToast('Resource successfully deleted')
    })
  })
})
