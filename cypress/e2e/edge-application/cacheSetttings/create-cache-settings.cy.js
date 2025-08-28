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
  cy.intercept('POST', '/v4/edge_application/applications*').as('createEdgeApp')
  cy.get(selectors.form.actionsSubmitButton).click()
  cy.wait('@createEdgeApp')
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

describe('Edge Application', { tags: ['@dev8'] }, () => {
  beforeEach(() => {
    fixtures.edgeApplicationName = generateUniqueName('EdgeApp')
    cy.intercept('GET', '/api/account/info', {
      fixture: '/account/info/without_flags.json'
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

  it('should create a cache setting', () => {
    cy.openProduct('Edge Application')
    cy.intercept('GET', '/v4/edge_application/applications/*/cache_settings*').as('getCacheSettings')

    // Act - Create an edge application
    createEdgeApplicationCase()

    // Act - create a cache setting
    cy.get(selectors.edgeApplication.tabs('Cache Settings')).click()
    cy.wait('@getCacheSettings')
    cy.get(selectors.edgeApplication.cacheSettings.createButton).click()
    cy.get(selectors.edgeApplication.cacheSettings.nameInput).clear()
    cy.get(selectors.edgeApplication.cacheSettings.nameInput).type(
      fixtures.cacheSettingName
    )
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your cache setting has been created')
    cy.wait('@getCacheSettings')

    // Assert
    cy.get(selectors.list.searchInput).clear()
    cy.get(selectors.list.searchInput).type(`${fixtures.cacheSettingName}{enter}`)
    cy.get(selectors.edgeApplication.cacheSettings.firstFilteredNameRow).should(
      'have.text',
      fixtures.cacheSettingName
    )
  })
})
