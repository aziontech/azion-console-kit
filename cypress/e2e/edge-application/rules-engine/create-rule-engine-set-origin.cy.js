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

describe('Edge Application', { tags: ['@dev3'] }, () => {
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
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsOption('Set Origin')).click()
    cy.get(selectors.edgeApplication.rulesEngine.setOriginSelect(0)).click()
    cy.get(selectors.edgeApplication.rulesEngine.createOriginButton).click()
    cy.get(selectors.edgeApplication.origins.nameInput).type(fixtures.originName)
    cy.get(selectors.edgeApplication.origins.originType).click()
    cy.get(selectors.edgeApplication.origins.originType)
      .find('li')
      .eq(0)
      .should('have.text', 'Single Origin')
      .click()

    cy.get(selectors.edgeApplication.origins.addressInput).type('test.com')

    cy.intercept('GET', 'api/v3/edge_applications/*/origin*').as('getOrigin')
    cy.get(selectors.edgeApplication.rulesEngine.originActionBar)
      .find(selectors.form.actionsSubmitButton)
      .click()
    cy.get('.p-component-overlay > .p-dialog > .p-dialog-header').should(
      'have.text',
      'Origin Key has been created'
    )
    cy.get(selectors.edgeApplication.origins.dialogCopyButton).click()
    cy.verifyToast('success', 'Your origin has been created')
    cy.verifyToast('Successfully copied!')
    cy.get(selectors.edgeApplication.origins.dialogCloseButton).click()

    cy.get(selectors.edgeApplication.rulesEngine.setOriginSelect(0)).click()
    cy.get(selectors.edgeApplication.rulesEngine.setOriginSelect(0))
      .find(selectors.edgeApplication.rulesEngine.originOption(fixtures.originName))
      .click()

    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Rule successfully created')

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
