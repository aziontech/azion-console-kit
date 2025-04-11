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
  cy.intercept('GET', '/api/v3/edge_applications/*').as('loadMainSettings')
  // Act - Navigate to the created edge application
  cy.get(selectors.list.filteredRow.column('name')).click()
  cy.wait('@loadMainSettings')
  cy.get(selectors.edgeApplication.mainSettings.l2CachingSwitch).click()
  cy.get(selectors.form.actionsSubmitButton).click()
  cy.verifyToast('success', 'Your edge application has been updated')
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
    // Arrange
    cy.intercept('GET', '/api/v4/edge_application/applications/*/cache_settings/*').as(
      'loadCacheSetting'
    )
    cy.openProduct('Edge Application')
    createEdgeApplicationCase()
  })

  it('should edit a cache setting', () => {
    // Act
    // Create a cache setting
    cy.get(selectors.edgeApplication.tabs('Cache Settings')).click()
    cy.get(selectors.edgeApplication.cacheSettings.createButton).click()
    cy.get(selectors.edgeApplication.cacheSettings.nameInput).type(fixtures.cacheSettingName)

    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Cache Settings successfully created')

    cy.get(selectors.list.searchInput).type(`${fixtures.cacheSettingName}{enter}`)

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
  it('should be possible to disable large file optimization when tiered caching is enabled', () => {
    // Act
    // Create a cache setting
    cy.get(selectors.edgeApplication.tabs('Cache Settings')).click()
    cy.get(selectors.edgeApplication.cacheSettings.createButton).click()
    cy.get(selectors.edgeApplication.cacheSettings.enableTieredCachingSwitch).click()
    cy.get(selectors.edgeApplication.cacheSettings.tieredCacheRegionDropdown).click()
    cy.get(selectors.edgeApplication.cacheSettings.tieredCacheRegionOption('0')).click()
    cy.get(selectors.edgeApplication.cacheSettings.nameInput).type(fixtures.cacheSettingName)

    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Cache Settings successfully created')

    cy.get(selectors.list.searchInput).type(`${fixtures.cacheSettingName}{enter}`)

    cy.get(selectors.list.filteredRow.column('name')).should('have.text', fixtures.cacheSettingName)

    // Edit the cache setting
    cy.get(selectors.list.filteredRow.column('name')).click()
    cy.wait('@loadCacheSetting')

    cy.get(selectors.edgeApplication.cacheSettings.largeFileOptimizationSwitch).click()
    cy.intercept('PUT', '/api/v4/edge_application/applications/*/cache_settings/*', (req) => {
      expect(req.body).to.have.property('slice_controls')
      expect(req.body.slice_controls).to.have.property('slice_configuration_enabled', false)
      expect(req.body.slice_controls).to.have.property('slice_edge_caching_enabled', false)
      expect(req.body.slice_controls).to.have.property('slice_tiered_caching_enabled', false)
    }).as('updateCacheSetting')
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.verifyToast('success', 'Cache Settings successfully edited')
    cy.wait('@updateCacheSetting')
  })
})
