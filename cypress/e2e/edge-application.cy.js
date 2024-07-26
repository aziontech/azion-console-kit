import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

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
  cy.get(selectors.list.searchInput).type(fixtures.edgeApplicationName)
  cy.get(selectors.list.filteredRow.column('name')).should(
    'have.text',
    fixtures.edgeApplicationName
  )

  // Act - Navigate to the created edge application
  cy.get(selectors.list.filteredRow.column('name')).click()
}

describe('Edge Application', { tags: ['@xfail'] }, () => {
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
  afterEach(() => {
    // Delete the edge application
    cy.deleteEntityFromList({
      entityName: fixtures.edgeApplicationName,
      productName: 'Edge Application'
    }).then(() => {
      cy.verifyToast('Resource successfully deleted')
    })
  })

  it('should create a rule engine', () => {
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
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsOption('Deliver')).click()
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your Rules Engine has been created.')

    // Assert
    cy.get(selectors.list.searchInput).type(fixtures.rulesEngineName)
    cy.get(selectors.list.filteredRow.column('name')).should('have.text', fixtures.rulesEngineName)

    // Cleanup - Remove the rule engine
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('Rule Engine successfully deleted')
    })
  })

  it('should add an origin', () => {
    //edge application creation
    cy.openProduct('Edge Application')
    createEdgeApplicationCase()

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

    cy.get(selectors.edgeApplication.origins.addressInput).type('teste.com')
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your origin has been created')
    cy.get(selectors.form.goBackButton).click()
    cy.get(selectors.form.leavePageButton).click()

    //Assert
    cy.get(selectors.list.searchInput).type(fixtures.originName)
    cy.get(selectors.list.filteredRow.column('name')).should('have.text', fixtures.originName)
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
    cy.get(selectors.edgeApplication.errorResponses.origin).find('li').eq(0).click()

    //assert
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your Error Responses has been edited')
    cy.get(selectors.form.actionsCancelButton).click()
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

  it('should edit a rule engine', () => {
    // Arrange
    // Create an edge application
    cy.openProduct('Edge Application')
    createEdgeApplicationCase()

    cy.get(selectors.edgeApplication.mainSettings.modulesSwitch('applicationAccelerator')).click()
    cy.get(selectors.edgeApplication.mainSettings.modulesSwitch('deviceDetection')).click()
    cy.get(selectors.edgeApplication.mainSettings.modulesSwitch('edgeFunctions')).click()
    cy.get(selectors.edgeApplication.mainSettings.modulesSwitch('imageOptimization')).click()
    cy.get(selectors.edgeApplication.mainSettings.modulesSwitch('loadBalancer')).click()

    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your edge application has been updated')

    cy.get(selectors.form.actionsCancelButton).click()

    cy.get(selectors.list.searchInput).type(fixtures.edgeApplicationName)
    cy.get(selectors.list.filteredRow.column('name')).should(
      'have.text',
      fixtures.edgeApplicationName
    )

    // Navigate to Rules Engine Tab
    cy.get(selectors.list.filteredRow.column('name')).click()
    cy.get(selectors.edgeApplication.tabs('Rules Engine')).click()

    // Act
    // Create a rule
    cy.get(selectors.edgeApplication.rulesEngine.createButton).click()
    cy.get(selectors.edgeApplication.rulesEngine.ruleNameInput).type(fixtures.rulesEngineName)
    cy.get(selectors.edgeApplication.rulesEngine.criteriaVariableSelect(0, 0)).type(
      '${{}uri}{enter}'
    )
    cy.get(selectors.edgeApplication.rulesEngine.criteriaOperatorDropdown(0, 0)).click()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaOperatorOption('is equal')).click()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaInputValue(0, 0)).type('/')
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsDropdown(0)).click()
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsOption('Deliver')).click()

    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your Rules Engine has been created.')

    cy.get(selectors.list.searchInput).type(fixtures.rulesEngineName)
    cy.get(selectors.list.filteredRow.column('name')).should('have.text', fixtures.rulesEngineName)

    // Edit the rule
    cy.get(selectors.list.filteredRow.column('name')).click()

    // And criteria
    cy.get(selectors.edgeApplication.rulesEngine.criteriaConditionalButton('And')).click()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaOperatorDropdown(0, 1)).click()
    cy.get(
      selectors.edgeApplication.rulesEngine.criteriaOperatorOption('does not start with')
    ).click()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaInputValue(0, 1)).clear()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaInputValue(0, 1)).type('/api')

    // new criteria
    cy.get(selectors.edgeApplication.rulesEngine.criteriaAddButton).click()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaVariableSelect(1, 0)).clear()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaVariableSelect(1, 0)).type(
      '${{}domain}{enter}'
    )
    cy.get(selectors.edgeApplication.rulesEngine.criteriaInputValue(1, 0)).type('azn.com')

    // edit behaviors
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsDropdown(0)).click()
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsOption('Enable Gzip')).click()
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsAddButton).click()
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsDropdown(1)).click()
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsOption('Deny (403 Forbidden)')).click()

    // Assert
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your Rules Engine has been edited')
  })

  it('should create a function instance', () => {
    createFunctionCase()
    cy.openProduct('Edge Application')

    // Act - Create an edge application
    createEdgeApplicationCase()

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
    cy.get(selectors.edgeApplication.functionsInstance.edgeFunctionsDropdown).click()
    cy.get(selectors.edgeApplication.functionsInstance.dropdownFilter).clear()
    cy.get(selectors.edgeApplication.functionsInstance.dropdownFilter).type(fixtures.functionName)
    cy.get(selectors.edgeApplication.functionsInstance.firstEdgeFunctionDropdownOption).click()
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.verifyToast('success', 'Your Function has been created')
    cy.get(selectors.list.searchInput).clear()
    cy.get(selectors.list.searchInput).type(fixtures.functionInstanceName)
    cy.get(selectors.edgeApplication.functionsInstance.firstFilteredNameRow).should(
      'have.text',
      fixtures.functionInstanceName
    )
    cy.get(selectors.edgeApplication.functionsInstance.firstFilteredEdgeFunctionRow).should(
      'have.text',
      fixtures.functionName
    )

    // Cleanup - Remove the instance
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('Function successfully deleted')
    })
  })

  it('should edit a function instance', () => {
    createFunctionCase()
    cy.openProduct('Edge Application')

    createEdgeApplicationCase()

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
    cy.get(selectors.edgeApplication.functionsInstance.edgeFunctionsDropdown).click()
    cy.get(selectors.edgeApplication.functionsInstance.dropdownFilter).clear()
    cy.get(selectors.edgeApplication.functionsInstance.dropdownFilter).type(fixtures.functionName)
    cy.get(selectors.edgeApplication.functionsInstance.firstEdgeFunctionDropdownOption).click()
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert - Verify the instance was created
    cy.verifyToast('success', 'Your Function has been created')
    cy.get(selectors.list.searchInput).clear()
    cy.get(selectors.list.searchInput).type(fixtures.functionInstanceName)
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

  it('should instantiate a function in a rules engine', () => {
    cy.intercept('/api/v3/edge_applications/*/functions_instances*').as('loadFunctionInstance')
    createFunctionCase()
    cy.openProduct('Edge Application')

    createEdgeApplicationCase()

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
    cy.get(selectors.edgeApplication.functionsInstance.edgeFunctionsDropdown).click()
    cy.get(selectors.edgeApplication.functionsInstance.dropdownFilter).clear()
    cy.get(selectors.edgeApplication.functionsInstance.dropdownFilter).type(fixtures.functionName)
    cy.get(selectors.edgeApplication.functionsInstance.firstEdgeFunctionDropdownOption).click()
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert - Verify the instance was created
    cy.verifyToast('success', 'Your Function has been created')
    cy.get(selectors.list.searchInput).clear()
    cy.get(selectors.list.searchInput).type(fixtures.functionInstanceName)
    cy.get(selectors.edgeApplication.functionsInstance.firstFilteredNameRow).should(
      'have.text',
      fixtures.functionInstanceName
    )
    cy.get(selectors.edgeApplication.functionsInstance.firstFilteredEdgeFunctionRow).should(
      'have.text',
      fixtures.functionName
    )

    // Act - Create a rule engine
    cy.get(selectors.edgeApplication.tabs('Rules Engine')).click()
    cy.get(selectors.edgeApplication.rulesEngine.createButton).click()
    cy.get(selectors.edgeApplication.rulesEngine.ruleNameInput).type(fixtures.rulesEngineName)
    cy.get(selectors.edgeApplication.rulesEngine.criteriaOperatorDropdown(0, 0)).click()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaOperatorOption('is equal')).click()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaInputValue(0, 0)).clear()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaInputValue(0, 0)).type('/')

    // Act - Select the function instance
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsDropdown(0)).click()
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsOption('Run Function')).click()
    cy.wait('@loadFunctionInstance')
    cy.get(selectors.edgeApplication.rulesEngine.dropdownLoadingIcon).should('not.exist')
    cy.get(selectors.edgeApplication.rulesEngine.behaviorFunctionValue).click()
    cy.get(selectors.edgeApplication.rulesEngine.behaviorFunctionInstanceFilterInput).clear()
    cy.get(selectors.edgeApplication.rulesEngine.behaviorFunctionInstanceFilterInput).type(
      fixtures.functionInstanceName
    )
    cy.get(selectors.edgeApplication.rulesEngine.firstBehaviorValueOption).click()
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert - Rules engine was created
    cy.verifyToast('success', 'Your Rules Engine has been created.')
    cy.get(selectors.list.searchInput).type(fixtures.rulesEngineName)
    cy.get(selectors.list.filteredRow.column('name')).should('have.text', fixtures.rulesEngineName)

    // Cleanup - Remove the rule engine
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('Rule Engine successfully deleted')
    })
  })
})
