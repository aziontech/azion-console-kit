import generateUniqueName from '../../../support/utils'
import selectors from '../../../support/selectors'
import { accountInfoNotFlagBlockApiv4 } from './account-info-data.js'
import { edgeConnectorsdata } from './edge-connectors-data'

let fixtures = {}

/**
 * Creates a new edge application with basic settings.
 */
const createEdgeApplicationCase = () => {
  // Act
  cy.intercept('POST', '/v4/edge_application/applications*').as('createEdgeApp')

  cy.get(selectors.edgeApplication.mainSettings.createButton).click()
  cy.get(selectors.edgeApplication.mainSettings.nameInput).type(fixtures.edgeApplicationName)
  cy.get(selectors.form.actionsSubmitButton).click()
  cy.wait('@createEdgeApp')
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

describe('Edge Application', { tags: ['@dev3'] }, () => {
  beforeEach(() => {
    fixtures.edgeApplicationName = generateUniqueName('EdgeApp')
    cy.intercept(
      { method: 'GET', url: '/api/account/info' },
      {
        statusCode: 200,
        body: accountInfoNotFlagBlockApiv4()
      }
    ).as('getAccountInfo')

    // Login
    cy.login()

    cy.wait('@getAccountInfo')

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
    cy.intercept(
      { method: 'GET', url: '/api/v4/edge_connector/connectors?**' },
      {
        statusCode: 200,
        body: edgeConnectorsdata
      }
    ).as('listEdgeConnectors')
    cy.intercept({ method: 'POST', url: '/v4/edge_application/applications/**' }, { body: [], statusCode: 202 }).as('createRulesEngineEdgeConnector')

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
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsOption('Set Edge Connectors')).click()

    cy.wait('@listEdgeConnectors')

    cy.get(selectors.edgeApplication.rulesEngine.edgeConnectorsDropdown).click()
    cy.get(selectors.edgeApplication.rulesEngine.edgeConnectorsDropdownItem).click()

    cy.get(selectors.form.actionsSubmitButton).click()
    cy.wait('@createRulesEngineEdgeConnector')

    cy.verifyToast('success', 'Rule successfully created')
  })
})
