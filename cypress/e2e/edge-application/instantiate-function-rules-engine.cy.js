import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let fixtures = {}

/**
 * Creates a new edge function.
 */
const createFunctionCase = () => {
  cy.openProduct('Edge Functions')

  // Act
  cy.get(selectors.functions.createButton).click()
  cy.get(selectors.functions.nameInput).clear()
  cy.get(selectors.functions.nameInput).type(fixtures.functionName, { delay: 0 })
  cy.get(selectors.functions.saveButton).click()
  cy.verifyToast('success', 'Your edge function has been created')
}

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
  cy.get(selectors.list.searchInput).type(fixtures.edgeApplicationName)
  cy.get(selectors.list.filteredRow.column('name')).should(
    'have.text',
    fixtures.edgeApplicationName
  )

  // Act - Navigate to the created edge application
  cy.get(selectors.list.filteredRow.column('name')).click()
}

describe('Edge Application', { tags: ['@dev', '@xfail'] }, () => {
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

  it('should instantiate a function in a rules engine', () => {
    cy.intercept('/api/v3/edge_applications/*/functions_instances*').as('loadFunctionInstance')
    createFunctionCase()
    cy.openProduct('Edge Application')

    createEdgeApplicationCase()

    // Act - create a function instance
    cy.get(selectors.edgeApplication.mainSettings.modulesSwitch('edgeFunctions')).click()
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your edge application has been updated')
    cy.get(selectors.edgeApplication.tabs('Functions Instances')).click()
    cy.get(selectors.edgeApplication.functionsInstance.createButton).click()
    cy.get(selectors.edgeApplication.functionsInstance.nameInput).clear()
    cy.get(selectors.edgeApplication.functionsInstance.nameInput).type(
      fixtures.functionInstanceName
    )
    cy.get(selectors.edgeApplication.functionsInstance.edgeFunctionsDropdown).click()
    cy.get(selectors.edgeApplication.functionsInstance.dropdownFilter).clear()
    cy.get(selectors.edgeApplication.functionsInstance.dropdownFilter).type(fixtures.functionName)
    cy.get(selectors.edgeApplication.functionsInstance.firstEdgeFunctionDropdownOption).click()
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert - Verify the instance was created
    cy.verifyToast('success', 'Your Function has been created')
    cy.get(selectors.list.searchInput).clear()
    cy.get(selectors.list.searchInput).type(fixtures.functionInstanceName)
    cy.get(selectors.edgeApplication.functionsInstance.firstFilteredNameRow).should(
      'have.text',
      fixtures.functionInstanceName
    )
    cy.get(selectors.edgeApplication.functionsInstance.firstFilteredEdgeFunctionRow).should(
      'have.text',
      fixtures.functionName
    )

    // Act - Create a rule engine
    cy.get(selectors.edgeApplication.tabs('Rules Engine')).click()
    cy.get(selectors.edgeApplication.rulesEngine.createButton).click()
    cy.get(selectors.edgeApplication.rulesEngine.ruleNameInput).type(fixtures.rulesEngineName)
    cy.get(selectors.edgeApplication.rulesEngine.criteriaOperatorDropdown(0, 0)).click()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaOperatorOption('is equal')).click()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaInputValue(0, 0)).clear()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaInputValue(0, 0)).type('/')

    // Act - Select the function instance
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsDropdown(0)).click()
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsOption('Run Function')).click()
    cy.wait('@loadFunctionInstance')
    cy.get(selectors.edgeApplication.rulesEngine.dropdownLoadingIcon).should('not.exist')
    cy.get(selectors.edgeApplication.rulesEngine.behaviorFunctionValue).click()
    cy.get(selectors.edgeApplication.rulesEngine.behaviorFunctionInstanceFilterInput).clear()
    cy.get(selectors.edgeApplication.rulesEngine.behaviorFunctionInstanceFilterInput).type(
      fixtures.functionInstanceName
    )
    cy.get(selectors.edgeApplication.rulesEngine.firstBehaviorValueOption).click()
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert - Rules engine was created
    cy.verifyToast('success', 'Your Rules Engine has been created.')
    cy.get(selectors.list.searchInput).type(fixtures.rulesEngineName)
    cy.get(selectors.list.filteredRow.column('name')).should('have.text', fixtures.rulesEngineName)

    // Cleanup - Remove the rule engine
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('Rule Engine successfully deleted')
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