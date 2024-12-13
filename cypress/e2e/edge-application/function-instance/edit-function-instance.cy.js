// cypress/integration/edge-application/edit-function-instance.spec.js
import generateUniqueName from '../../../support/utils'
import selectors from '../../../support/selectors'

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

  it('should edit a function instance', () => {
    createFunctionCase()
    cy.openProduct('Edge Application')

    createEdgeApplicationCase()
    cy.intercept(
      'GET',
      'api/v4/edge_functions/functions?ordering=name&page=1&page_size=100&fields=&search=*'
    ).as('getEdgeFunctions')

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

    cy.wait('@getEdgeFunctions')
    cy.get(selectors.edgeApplication.functionsInstance.edgeFunctionsDropdown).click()
    cy.get(selectors.edgeApplication.functionsInstance.dropdownFilter).clear()
    cy.get(selectors.edgeApplication.functionsInstance.dropdownFilter).type(fixtures.functionName)

    cy.wait('@getEdgeFunctions')
    cy.get(selectors.edgeApplication.functionsInstance.firstEdgeFunctionDropdownOption).click()
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert - Verify the instance was created
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

    // Act - Edit the instance
    const editedFunctionInstanceName = `${fixtures.functionInstanceName}-edit`
    cy.get(selectors.list.filteredRow.column('name')).click()
    cy.get(selectors.edgeApplication.functionsInstance.nameInput).should(
      'have.value',
      fixtures.functionInstanceName
    )
    cy.get(selectors.edgeApplication.functionsInstance.nameInput).clear()
    cy.get(selectors.edgeApplication.functionsInstance.nameInput).type(editedFunctionInstanceName)
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert - Verify the instance was edited
    cy.verifyToast('success', 'Your Function has been updated')
    cy.get(selectors.form.goBackButton).click()
    cy.get(selectors.edgeApplication.functionsInstance.firstFilteredNameRow).should(
      'have.text',
      editedFunctionInstanceName
    )

    // Cleanup - Remove the instance
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('Function successfully deleted')
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
