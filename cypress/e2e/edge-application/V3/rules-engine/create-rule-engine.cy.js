import generateUniqueName from '../../../../support/utils'
import selectors from '../../../../support/selectors'

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

  // Assert - Verify the edge application was created
  cy.get(selectors.list.searchInput).type(`${fixtures.edgeApplicationName}{enter}`)
  cy.get(selectors.list.filteredRow.column('name')).should(
    'have.text',
    fixtures.edgeApplicationName
  )

  // Act - Navigate to the created edge application
  cy.get(selectors.list.filteredRow.column('name')).click()
}

describe('Edge Application', { tags: ['@dev4'] }, () => {
  beforeEach(() => {
    fixtures.edgeApplicationName = generateUniqueName('EdgeApp')
    cy.intercept('GET', '/api/account/info', {
      fixture: '/account/info/domain_flags.json'
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

  it('should create a rule engine', () => {
    // Arrange
    cy.openProduct('Edge Application')
    createEdgeApplicationCase()
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
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsOption('Deliver')).click()
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Rule successfully created')

    // Assert
    cy.get(selectors.list.searchInput).type(`${fixtures.rulesEngineName}{enter}`)
    cy.get(selectors.list.filteredRow.column('name')).should('have.text', fixtures.rulesEngineName)
  })
})