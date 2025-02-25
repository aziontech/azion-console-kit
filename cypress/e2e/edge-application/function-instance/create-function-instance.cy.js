import generateUniqueName from '../../../support/utils'
import selectors from '../../../support/selectors'

let fixtures = {}

/**
 * Creates a new edge function.
 */
const createFunctionCase = () => {
  // Act
  cy.get(selectors.functions.nameInput).clear()
  cy.get(selectors.functions.nameInput).type(fixtures.functionName, { delay: 0 })
  cy.intercept('GET', 'api/v4/edge_functions/functions/*').as('getFunctions')
  cy.get(selectors.edgeApplication.functionsInstance.edgeFunctionActionbar)
    .find(selectors.functions.saveButton)
    .click()
  cy.verifyToast('success', 'Your edge function has been created')
  cy.wait('@getFunctions')
}

/**
 * Creates a new edge application with basic settings.
 */
const createEdgeApplicationCase = () => {
  // Act
  cy.get(selectors.edgeApplication.mainSettings.createButton).click()
  cy.get(selectors.edgeApplication.mainSettings.nameInput).type(fixtures.edgeApplicationName)
  cy.intercept('POST', 'api/v4/edge_application/applications*').as('createEdgeApp')
  cy.get(selectors.form.actionsSubmitButton).click()
  cy.wait('@createEdgeApp')
  cy.verifyToast('success', 'Your edge application has been created')
  cy.get(selectors.form.actionsSkipButton).click()
  cy.get(selectors.edgeApplication.mainSettings.unsaved).click()
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

  it('should create a function instance', () => {
    cy.openProduct('Edge Application')

    // Act - Create an edge application
    createEdgeApplicationCase()

    // Act - create a function instance
    cy.get(selectors.edgeApplication.mainSettings.modulesSwitch('edgeFunctionsEnabled')).click()
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your edge application has been updated')
    cy.get(selectors.edgeApplication.tabs('Functions Instances')).click()
    cy.intercept('GET', '/api/v4/edge_functions/functions*').as('getFunctions')
    cy.get(selectors.edgeApplication.functionsInstance.createButton).click()
    cy.get(selectors.edgeApplication.functionsInstance.nameInput).clear()
    cy.get(selectors.edgeApplication.functionsInstance.nameInput).type(
      fixtures.functionInstanceName
    )
    cy.wait('@getFunctions')
    cy.get(selectors.edgeApplication.functionsInstance.edgeFunctionsDropdown).click()
    cy.get(selectors.edgeApplication.functionsInstance.createFunctionButton).click()
    createFunctionCase()
    cy.get(selectors.edgeApplication.functionsInstance.functionInstanceActionbar)
      .find(selectors.functions.saveButton)
      .click()

    // Assert
    cy.verifyToast('success', 'Your Function has been created')
    cy.get(selectors.list.searchInput).clear()
    cy.get(selectors.list.searchInput).type(`${fixtures.functionInstanceName}{enter}`)
    cy.get(selectors.edgeApplication.functionsInstance.firstFilteredNameRow).should(
      'have.text',
      fixtures.functionInstanceName
    )
    cy.get(selectors.edgeApplication.functionsInstance.firstFilteredEdgeFunctionRow).should(
      'have.text',
      fixtures.functionName
    )
  })
})
