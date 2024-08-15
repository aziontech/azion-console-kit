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

describe('Edge Application', { tags: ['@dev4', '@xfail'] }, () => {
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

  it('should edit a cache setting', () => {
    // Arrange
    cy.intercept('GET', '/api/v3/edge_applications/*/cache_settings/*').as('loadCacheSetting')
    cy.openProduct('Edge Application')
    createEdgeApplicationCase()

    // Act
    // Create a cache setting
    cy.get(selectors.edgeApplication.tabs('Cache Settings')).click()
    cy.get(selectors.edgeApplication.cacheSettings.createButton).click()
    cy.get(selectors.edgeApplication.cacheSettings.nameInput).type(fixtures.cacheSettingName)

    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Cache Settings successfully created')

    cy.get(selectors.list.searchInput).type(fixtures.cacheSettingName)

    cy.get(selectors.list.filteredRow.column('name')).should('have.text', fixtures.cacheSettingName)
    cy.get(selectors.list.filteredRow.column('browserCache')).should(
      'have.text',
      'Honor Origin Cache Headers'
    )
    cy.get(selectors.list.filteredRow.column('cdnCache')).should(
      'have.text',
      'Honor Origin Cache Headers'
    )

    // Edit the cache setting
    cy.get(selectors.list.filteredRow.column('name')).click()
    cy.wait('@loadCacheSetting')

    cy.get(selectors.edgeApplication.cacheSettings.browserCacheSettingsRadio(1)).click()
    cy.get(selectors.edgeApplication.cacheSettings.browserCacheSettingsMaxTtlInput).type('100')
    cy.get(selectors.edgeApplication.cacheSettings.cacheByQueryStringRadio(3)).click()
    cy.get(selectors.edgeApplication.cacheSettings.cacheByCookieRadio(3)).click()

    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.verifyToast('success', 'Cache Settings successfully edited')
    cy.get(selectors.list.filteredRow.column('name')).should('have.text', fixtures.cacheSettingName)
    cy.get(selectors.list.filteredRow.column('browserCache')).should(
      'have.text',
      'Override Cache Settings'
    )
    cy.get(selectors.list.filteredRow.column('cdnCache')).should(
      'have.text',
      'Honor Origin Cache Headers'
    )
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