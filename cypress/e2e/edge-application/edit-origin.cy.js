import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

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
  cy.get(selectors.list.searchInput).type(fixtures.edgeApplicationName)
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

  it('should edit an origin', () => {
    //edge application creation
    cy.openProduct('Edge Application')
    createEdgeApplicationCase()

    //add origin
    cy.get(selectors.edgeApplication.tabs('Origins')).click()
    cy.get(selectors.edgeApplication.origins.createButton).click()

    //act
    cy.get(selectors.edgeApplication.origins.nameInput).type(fixtures.originName)
    cy.get(selectors.edgeApplication.origins.originType).click()
    cy.get(selectors.edgeApplication.origins.originType)
      .find('li')
      .eq(0)
      .should('have.text', 'Single Origin')
      .click()

    cy.get(selectors.edgeApplication.origins.addressInput).type('test.com')
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your origin has been created')
    cy.get(selectors.form.goBackButton).click()
    cy.get(selectors.form.leavePageButton).click()

    //Assert
    cy.get(selectors.list.searchInput).type(fixtures.originName)
    cy.get(selectors.list.filteredRow.column('name')).should('have.text', fixtures.originName)

    //edit origin
    //arrange
    cy.get(selectors.list.filteredRow.column('name')).click()

    //act
    cy.get(selectors.edgeApplication.origins.addressInput).clear()
    cy.get(selectors.edgeApplication.origins.addressInput).type('test2.com')
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your Origin has been edited')
    cy.get(selectors.form.goBackButton).click()

    //assert
    cy.get(selectors.list.searchInput).clear()
    cy.get(selectors.list.searchInput).type(fixtures.originName)
    cy.get(selectors.list.filteredRow.column('addresses')).should('have.text', 'test2.com')
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