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

  it('Create and delete an edge application, and create a rule', () => {
    // Create an edge application
    cy.get(selectors.edgeApplication.createButton).click()
    cy.get(selectors.edgeApplication.nameInput).type(fixtures.edgeApplicationName, { delay: 0 })
    cy.get(selectors.edgeApplication.addressInput).clear()
    cy.get(selectors.edgeApplication.addressInput).type('httpbingo.org', { delay: 0 })
    cy.get(selectors.edgeApplication.saveButton).click()
    cy.get(selectors.edgeApplication.cancelButton).click()

    // Verify the edge application was created
    cy.get(selectors.edgeApplication.searchInput).type(fixtures.edgeApplicationName, { delay: 0 })
    cy.get(selectors.edgeApplication.tableRowName)
      .should('be.visible')
      .should('have.text', fixtures.edgeApplicationName)

    // Navigate to Rules Engine Tab
    cy.get(selectors.edgeApplication.tableRowLastEditor).click()
    cy.get(selectors.edgeApplication.rulesEngineTab).click()

    // Create a rule
    cy.get(selectors.edgeApplication.addRuleButton).click()
    cy.get(selectors.edgeApplication.ruleNameInput).type(fixtures.rulesEngineName, { delay: 0 })
    cy.get(selectors.edgeApplication.criteriaOperatorDropdown).click()
    cy.get(selectors.edgeApplication.criteriaOperator).click()
    cy.get(selectors.edgeApplication.criteriaInputValue).clear('/')
    cy.get(selectors.edgeApplication.criteriaInputValue).type('/', { delay: 0 })
    cy.get(selectors.edgeApplication.behaviorsDropdown).click()
    cy.get(selectors.edgeApplication.behaviors).click()
    cy.get(selectors.edgeApplication.saveButton).click()
    cy.get('.flex-column > .text-sm').should('be.visible')

    // Verify the rule was created
    cy.get(selectors.edgeApplication.searchInput).type(fixtures.rulesEngineName, { delay: 0 })
    cy.get(selectors.edgeApplication.ruleTable)
      .should('be.visible')
      .should('have.text', fixtures.rulesEngineName)
  })

  it('should add an origin', () => {
    //edge application creation
    //arrange
    cy.get(selectors.edgeApplication.createButton).click()

    //act
    cy.get(selectors.edgeApplication.nameInput).type(fixtures.edgeApplicationName)
    cy.get(selectors.edgeApplication.addressInput).clear()
    cy.get(selectors.edgeApplication.addressInput).type('httpbingo.org')
    cy.get(selectors.edgeApplication.saveButton).click()
    cy.get(selectors.edgeApplication.cancelButton).click()

    //assert
    cy.get(selectors.edgeApplication.searchInput).type(fixtures.edgeApplicationName)
    cy.get(selectors.edgeApplication.tableRowName).should('have.text', fixtures.edgeApplicationName)

    //add origin
    //arrange
    cy.get(selectors.edgeApplication.tableRowLastEditor).click()
    cy.get(selectors.edgeApplication.tabOption(1)).click()
    cy.get(selectors.edgeApplication.createOrigin).click()

    //act
    cy.get(selectors.edgeApplication.nameInput).type(fixtures.originName)
    cy.get(selectors.edgeApplication.originType).click()
    cy.get(selectors.edgeApplication.originType)
      .find('li')
      .eq(0)
      .should('have.text', 'Single Origin')
      .click()

    cy.get(selectors.edgeApplication.originAddressInput).type('teste.com')
    cy.get(selectors.edgeApplication.saveButton).click()
    cy.get(selectors.edgeApplication.goBackButton).click()
    cy.get(selectors.edgeApplication.leavePageButton).click()

    //Assert
    cy.get(selectors.edgeApplication.searchInput).type(fixtures.originName)
    cy.get(selectors.edgeApplication.tableRowName).should('have.text', fixtures.originName)
  })

  it('should edit an origin', () => {
    //edge application creation
    //arrange
    cy.get(selectors.edgeApplication.createButton).click()

    //act
    cy.get(selectors.edgeApplication.nameInput).type(fixtures.edgeApplicationName)
    cy.get(selectors.edgeApplication.addressInput).clear()
    cy.get(selectors.edgeApplication.addressInput).type('httpbingo.org')
    cy.get(selectors.edgeApplication.saveButton).click()
    cy.get(selectors.edgeApplication.cancelButton).click()

    //assert
    cy.get(selectors.edgeApplication.searchInput).type(fixtures.edgeApplicationName)
    cy.get(selectors.edgeApplication.tableRowName).should('have.text', fixtures.edgeApplicationName)

    //add origin
    //arrange
    cy.get(selectors.edgeApplication.tableRowLastEditor).click()
    cy.get(selectors.edgeApplication.tabOption(1)).click()
    cy.get(selectors.edgeApplication.createOrigin).click()

    //act
    cy.get(selectors.edgeApplication.nameInput).type(fixtures.originName)
    cy.get(selectors.edgeApplication.originType).click()
    cy.get(selectors.edgeApplication.originType)
      .find('li')
      .eq(0)
      .should('have.text', 'Single Origin')
      .click()

    cy.get(selectors.edgeApplication.originAddressInput).type('test.com')
    cy.get(selectors.edgeApplication.saveButton).click()
    cy.get(selectors.edgeApplication.goBackButton).click()
    cy.get(selectors.edgeApplication.leavePageButton).click()

    //Assert
    cy.get(selectors.edgeApplication.searchInput).type(fixtures.originName)
    cy.get(selectors.edgeApplication.tableRowName).should('have.text', fixtures.originName)

    //edit origin
    //arrange
    cy.get(selectors.edgeApplication.tableRowName).click()

    //act
    cy.get(selectors.edgeApplication.originAddressInput).clear()
    cy.get(selectors.edgeApplication.originAddressInput).type('test2.com')
    cy.get(selectors.edgeApplication.saveButton).click()
    cy.get(selectors.edgeApplication.goBackButton).click()

    //assert
    cy.get(selectors.edgeApplication.searchInput).clear()
    cy.get(selectors.edgeApplication.searchInput).type(fixtures.originName)
    cy.get(selectors.edgeApplication.tableRowAddress).should('have.text', 'test2.com')
  })

  it('should add an error response', () => {
    //edge application creation
    //arrange
    cy.get(selectors.edgeApplication.createButton).click()

    //act
    cy.get(selectors.edgeApplication.nameInput).type(fixtures.edgeApplicationName)
    cy.get(selectors.edgeApplication.addressInput).clear()
    cy.get(selectors.edgeApplication.addressInput).type('httpbingo.org')
    cy.get(selectors.edgeApplication.saveButton).click()
    cy.get(selectors.edgeApplication.cancelButton).click()

    //assert
    cy.get(selectors.edgeApplication.searchInput).type(fixtures.edgeApplicationName)
    cy.get(selectors.edgeApplication.tableRowName).should('have.text', fixtures.edgeApplicationName)

    //add error response
    //arrange
    cy.get(selectors.edgeApplication.tableRowLastEditor).click()
    cy.get(selectors.edgeApplication.tabOption(3)).click()

    //act
    //add error response 1
    cy.get(selectors.edgeApplication.addErrorResponse).click()
    cy.get(selectors.edgeApplication.errorResponseStatusCodes(1)).click()
    cy.get(selectors.edgeApplication.errorResponseStatusCodes(1)).find('li').eq(0).click()
    cy.get(selectors.edgeApplication.errorResponsePaths(1)).type('/test/')
    cy.get(selectors.edgeApplication.errorResponseCustomStatus(1)).type('200')

    //add error response 2
    cy.get(selectors.edgeApplication.addErrorResponse).click()
    cy.get(selectors.edgeApplication.errorResponseStatusCodes(2)).click()
    cy.get(selectors.edgeApplication.errorResponseStatusCodes(2)).find('li').eq(1).click()
    cy.get(selectors.edgeApplication.errorResponsePaths(2)).type('/test/test2')
    cy.get(selectors.edgeApplication.errorResponseCustomStatus(2)).type('200')

    //select origin
    cy.get(selectors.edgeApplication.errorResponseOrigin).click()
    cy.get(selectors.edgeApplication.errorResponseOrigin).find('li').eq(0).click()

    //save
    cy.get(selectors.edgeApplication.saveButton).click()
    cy.get(selectors.edgeApplication.cancelButton).click()

    //assert
    cy.verifyToast('success', 'Your Error Responses has been edited')
  })

  it.only('should edit a cache setting', () => {
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
