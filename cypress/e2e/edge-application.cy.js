import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

let fixtures = {}

describe('Edge Application', { tags: ['@dev'] }, () => {
  beforeEach(() => {
    fixtures.edgeApplicationName = generateUniqueName('EdgeApp')
    // Login
    cy.login()
    cy.openProduct('Edge Application')

    fixtures = {
      edgeApplicationName: generateUniqueName('EdgeApp'),
      originName: generateUniqueName('origin'),
      rulesEngineName: generateUniqueName('RulesEng'),
      cacheSettingName: generateUniqueName('cacheSetting')
    }
  })

  it('should create a rule engine', () => {
    // Arrange
    // Create an edge application
    cy.get(selectors.edgeApplication.mainSettings.createButton).click()
    cy.get(selectors.edgeApplication.mainSettings.nameInput).type(fixtures.edgeApplicationName, {
      delay: 0
    })
    cy.get(selectors.edgeApplication.mainSettings.addressInput).clear()
    cy.get(selectors.edgeApplication.mainSettings.addressInput).type('httpbingo.org', { delay: 0 })
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your edge application has been created')
    cy.get(selectors.form.actionsCancelButton).click()

    // Verify the edge application was created
    cy.get(selectors.list.searchInput).type(fixtures.edgeApplicationName, { delay: 0 })
    cy.get(selectors.edgeApplication.list.tableRow('name')).should(
      'have.text',
      fixtures.edgeApplicationName
    )

    // Navigate to Rules Engine Tab
    cy.get(selectors.edgeApplication.list.tableRow('name')).click()
    cy.get(selectors.edgeApplication.list.tabs('Rules Engine')).click()

    // Act
    // Create a rule
    cy.get(selectors.edgeApplication.rulesEngine.createButton).click()
    cy.get(selectors.edgeApplication.rulesEngine.ruleNameInput).type(fixtures.rulesEngineName, {
      delay: 0
    })
    cy.get(selectors.edgeApplication.rulesEngine.criteriaOperatorDropdown).click()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaOperator).click()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaInputValue).clear()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaInputValue).type('/', { delay: 0 })
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsDropdown).click()
    cy.get(selectors.edgeApplication.rulesEngine.behaviors).click()
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your Rules Engine has been created.')

    // Assert
    cy.get(selectors.list.searchInput).type(fixtures.rulesEngineName, { delay: 0 })
    cy.get(selectors.edgeApplication.list.tableRow('name')).should(
      'have.text',
      fixtures.rulesEngineName
    )
  })

  it('should add an origin', () => {
    //edge application creation
    //arrange
    cy.get(selectors.edgeApplication.mainSettings.createButton).click()

    //act
    cy.get(selectors.edgeApplication.mainSettings.nameInput).type(fixtures.edgeApplicationName)
    cy.get(selectors.edgeApplication.mainSettings.addressInput).clear()
    cy.get(selectors.edgeApplication.mainSettings.addressInput).type('httpbingo.org')
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your edge application has been created')
    cy.get(selectors.form.actionsCancelButton).click()

    //assert
    cy.get(selectors.list.searchInput).type(fixtures.edgeApplicationName)
    cy.get(selectors.edgeApplication.list.tableRow('name')).should(
      'have.text',
      fixtures.edgeApplicationName
    )

    //add origin
    //arrange
    cy.get(selectors.edgeApplication.list.tableRow('name')).click()
    cy.get(selectors.edgeApplication.list.tabs('Origins')).click()
    cy.get(selectors.edgeApplication.origins.createButton).click()

    //act
    cy.get(selectors.edgeApplication.origins.nameInput).type(fixtures.originName)
    cy.get(selectors.edgeApplication.origins.originType).click()
    cy.get(selectors.edgeApplication.origins.originType)
      .find('li')
      .eq(0)
      .should('have.text', 'Single Origin')
      .click()

    cy.get(selectors.edgeApplication.origins.addressInput).type('teste.com')
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your origin has been created')
    cy.get(selectors.form.goBackButton).click()
    cy.get(selectors.form.leavePageButton).click()

    //Assert
    cy.get(selectors.list.searchInput).type(fixtures.originName)
    cy.get(selectors.edgeApplication.list.tableRow('name')).should('have.text', fixtures.originName)
  })

  it('should edit an origin', () => {
    //edge application creation
    //arrange
    cy.get(selectors.edgeApplication.mainSettings.createButton).click()

    //act
    cy.get(selectors.edgeApplication.mainSettings.nameInput).type(fixtures.edgeApplicationName)
    cy.get(selectors.edgeApplication.mainSettings.addressInput).clear()
    cy.get(selectors.edgeApplication.mainSettings.addressInput).type('httpbingo.org')
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your edge application has been created')
    cy.get(selectors.form.actionsCancelButton).click()

    //assert
    cy.get(selectors.list.searchInput).type(fixtures.edgeApplicationName)
    cy.get(selectors.edgeApplication.list.tableRow('name')).should(
      'have.text',
      fixtures.edgeApplicationName
    )

    //add origin
    //arrange
    cy.get(selectors.edgeApplication.list.tableRow('name')).click()
    cy.get(selectors.edgeApplication.list.tabs('Origins')).click()
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
    cy.get(selectors.edgeApplication.list.tableRow('name')).should('have.text', fixtures.originName)

    //edit origin
    //arrange
    cy.get(selectors.edgeApplication.list.tableRow('name')).click()

    //act
    cy.get(selectors.edgeApplication.origins.addressInput).clear()
    cy.get(selectors.edgeApplication.origins.addressInput).type('test2.com')
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your Origin has been edited')
    cy.get(selectors.form.goBackButton).click()

    //assert
    cy.get(selectors.list.searchInput).clear()
    cy.get(selectors.list.searchInput).type(fixtures.originName)
    cy.get(selectors.edgeApplication.list.tableRow('addresses')).should('have.text', 'test2.com')
  })

  it('should add an error response', () => {
    //edge application creation
    //arrange
    cy.get(selectors.edgeApplication.mainSettings.createButton).click()

    //act
    cy.get(selectors.edgeApplication.mainSettings.nameInput).type(fixtures.edgeApplicationName)
    cy.get(selectors.edgeApplication.mainSettings.addressInput).clear()
    cy.get(selectors.edgeApplication.mainSettings.addressInput).type('httpbingo.org')
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your edge application has been created')
    cy.get(selectors.form.actionsCancelButton).click()

    //assert
    cy.get(selectors.list.searchInput).type(fixtures.edgeApplicationName)
    cy.get(selectors.edgeApplication.list.tableRow('name')).should(
      'have.text',
      fixtures.edgeApplicationName
    )

    //add error response
    //arrange
    cy.get(selectors.edgeApplication.list.tableRow('name')).click()
    cy.get(selectors.edgeApplication.list.tabs('Error Responses')).click()

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
    cy.get(selectors.edgeApplication.errorResponses.origin).find('li').eq(0).click()

    //assert
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your Error Responses has been edited')
    cy.get(selectors.form.actionsCancelButton).click()
  })

  it('should edit a cache setting', () => {
    // Arrange
    cy.intercept('GET', '/api/v3/edge_applications/*/cache_settings/*').as('loadCacheSetting')
    // Create an edge application
    cy.get(selectors.edgeApplication.createButton).click()
    cy.get(selectors.edgeApplication.nameInput).type(fixtures.edgeApplicationName, { delay: 0 })
    cy.get(selectors.edgeApplication.addressInput).clear()
    cy.get(selectors.edgeApplication.addressInput).type('httpbingo.org', { delay: 0 })
    cy.get(selectors.edgeApplication.saveButton).click()
    cy.get(selectors.edgeApplication.cancelButton).click()

    cy.get(selectors.list.searchInput).type(fixtures.edgeApplicationName, { delay: 0 })
    cy.get(selectors.edgeApplication.list.tableRow('name')).click()

    // Act
    // Create a cache setting
    cy.get(selectors.edgeApplication.list.tabs('Cache Settings')).click()
    cy.get(selectors.edgeApplication.cacheSettings.createButton).click()
    cy.get(selectors.edgeApplication.cacheSettings.nameInput).type(fixtures.cacheSettingName)

    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Cache Settings successfully created')

    cy.get(selectors.list.searchInput).type(fixtures.cacheSettingName)

    cy.get(selectors.edgeApplication.list.tableRow('name')).should(
      'have.text',
      fixtures.cacheSettingName
    )
    cy.get(selectors.edgeApplication.list.tableRow('browserCache')).should(
      'have.text',
      'Honor Origin Cache Headers'
    )
    cy.get(selectors.edgeApplication.list.tableRow('cdnCache')).should(
      'have.text',
      'Honor Origin Cache Headers'
    )

    // Edit the cache setting
    cy.get(selectors.edgeApplication.list.tableRow('name')).click()
    cy.wait('@loadCacheSetting')

    cy.get(selectors.edgeApplication.cacheSettings.browserCacheSettingsRadio(1)).click()
    cy.get(selectors.edgeApplication.cacheSettings.browserCacheSettingsMaxTtlInput).type('100')
    cy.get(selectors.edgeApplication.cacheSettings.cacheByQueryStringRadio(3)).click()
    cy.get(selectors.edgeApplication.cacheSettings.cacheByCookieRadio(3)).click()

    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.verifyToast('success', 'Cache Settings successfully edited')
    cy.get(selectors.edgeApplication.list.tableRow('name')).should(
      'have.text',
      fixtures.cacheSettingName
    )
    cy.get(selectors.edgeApplication.list.tableRow('browserCache')).should(
      'have.text',
      'Override Cache Settings'
    )
    cy.get(selectors.edgeApplication.list.tableRow('cdnCache')).should(
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
