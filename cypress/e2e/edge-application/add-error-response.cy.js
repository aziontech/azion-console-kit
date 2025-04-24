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
    cy.intercept('GET', '/api/v3/edge_applications/*/origins*').as('getOriginsApi')

    fixtures = {
      functionName: generateUniqueName('EdgeFunction'),
      functionInstanceName: generateUniqueName('FunctionsInstance'),
      edgeApplicationName: generateUniqueName('EdgeApp'),
      originName: generateUniqueName('origin'),
      rulesEngineName: generateUniqueName('RulesEng'),
      cacheSettingName: generateUniqueName('cacheSetting')
    }
  })

  it('should add an error response', () => {
    //arrange
    cy.openProduct('Edge Application')
    createEdgeApplicationCase()
    cy.get(selectors.edgeApplication.tabs('Error Responses')).click()

    //act
    //add error response 1
    cy.get(selectors.edgeApplication.errorResponses.createButton).click()
    cy.get(selectors.edgeApplication.errorResponses.statusCodes(1)).click()
    cy.get(selectors.edgeApplication.errorResponses.statusCodes(1)).find('li').eq(0).click()
    cy.get(selectors.edgeApplication.errorResponses.paths(1)).type('/test/')
    cy.get(selectors.edgeApplication.errorResponses.customStatus(1)).type('200')

    //add error response 2
    cy.get(selectors.edgeApplication.errorResponses.createButton).click()
    cy.get(selectors.edgeApplication.errorResponses.statusCodes(2)).click()
    cy.get(selectors.edgeApplication.errorResponses.statusCodes(2)).find('li').eq(1).click()
    cy.get(selectors.edgeApplication.errorResponses.paths(2)).type('/test/test2')
    cy.get(selectors.edgeApplication.errorResponses.customStatus(2)).type('200')

    //select origin
    cy.get(selectors.edgeApplication.errorResponses.origin).click()
    cy.wait('@getOriginsApi')
    cy.get(selectors.edgeApplication.errorResponses.origin).find('li').eq(0).click()

    //assert
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your Error Responses has been edited')
    cy.get(selectors.form.actionsCancelButton).click()
  })
})
