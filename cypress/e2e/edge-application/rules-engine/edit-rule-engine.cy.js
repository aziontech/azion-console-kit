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

// TODO: remove xfail tag when the API v4 is fixed
describe('Edge Application', { tags: ['@dev4'] }, () => {
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

  it('should edit a rule engine', () => {
    // Arrange
    // Create an edge application
    cy.openProduct('Edge Application')
    createEdgeApplicationCase()

    cy.get(selectors.edgeApplication.mainSettings.modulesSwitch('applicationAccelerator')).click()
    cy.get(selectors.edgeApplication.mainSettings.modulesSwitch('deviceDetection')).click()
    cy.get(selectors.edgeApplication.mainSettings.modulesSwitch('edgeFunctions')).click()
    cy.get(selectors.edgeApplication.mainSettings.modulesSwitch('imageOptimization')).click()
    cy.get(selectors.edgeApplication.mainSettings.modulesSwitch('loadBalancer')).click()

    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your edge application has been updated')

    cy.get(selectors.form.actionsCancelButton).click()

    cy.get(selectors.list.searchInput).type(`${fixtures.edgeApplicationName}{enter}`)
    cy.get(selectors.list.filteredRow.column('name')).should(
      'have.text',
      fixtures.edgeApplicationName
    )

    // Navigate to Rules Engine Tab
    cy.get(selectors.list.filteredRow.column('name')).click()
    cy.get(selectors.edgeApplication.tabs('Rules Engine')).click()

    // Act
    // Create a rule
    cy.get(selectors.edgeApplication.rulesEngine.createButton).click()
    cy.get(selectors.edgeApplication.rulesEngine.ruleNameInput).type(fixtures.rulesEngineName)
    cy.get(selectors.edgeApplication.rulesEngine.phaseRadioGroup).should(
      'not.have.class',
      'p-disabled'
    )
    cy.get(selectors.edgeApplication.rulesEngine.criteriaVariableSelect(0, 0)).type(
      '${{}uri}{enter}'
    )
    cy.get(selectors.edgeApplication.rulesEngine.criteriaOperatorDropdown(0, 0)).click()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaOperatorOption('is equal')).click()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaInputValue(0, 0)).type('/')
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsDropdown(0)).click()
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsOption('Deliver')).click()

    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Rule successfully created')

    cy.get(selectors.list.searchInput).type(`${fixtures.rulesEngineName}{enter}`)
    cy.get(selectors.list.filteredRow.column('name')).should('have.text', fixtures.rulesEngineName)

    // Edit the rule
    cy.get(selectors.list.filteredRow.column('name')).click()

    // And criteria
    cy.get(selectors.edgeApplication.rulesEngine.criteriaConditionalButton('And')).click()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaOperatorDropdown(0, 1)).click()
    cy.get(
      selectors.edgeApplication.rulesEngine.criteriaOperatorOption('does not start with')
    ).click()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaInputValue(0, 1)).clear()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaInputValue(0, 1)).type('/api')

    // new criteria
    cy.get(selectors.edgeApplication.rulesEngine.criteriaAddButton).click()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaVariableSelect(1, 0)).clear()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaVariableSelect(1, 0)).type(
      '${{}domain}{enter}'
    )
    cy.get(selectors.edgeApplication.rulesEngine.criteriaInputValue(1, 0)).type('azn.com')

    // edit behaviors
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsDropdown(0)).click()
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsOption('Enable Gzip')).click()
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsAddButton).click()
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsDropdown(1)).click()
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsOption('Deny (403 Forbidden)')).click()

    // Assert
    cy.get(selectors.edgeApplication.rulesEngine.phaseRadioGroup).should('have.class', 'p-disabled')

    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Rule successfully edited')
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
