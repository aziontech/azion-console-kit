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
  cy.get(selectors.edgeApplication.mainSettings.addressInput).type('httpbingo.org')
  cy.get(selectors.form.actionsSubmitButton).click()
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

describe('Edge Application', { tags: ['@dev4'] }, () => {
  beforeEach(() => {
    fixtures.edgeApplicationName = generateUniqueName('EdgeApp')
    cy.intercept('GET', '/api/account/info', {
      fixture: '/account/info/domain_flags.json'
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

  it('should edit an origin', () => {
    //edge application creation
    cy.openProduct('Edge Application')
    createEdgeApplicationCase()

    //add loadbalancer module
    cy.get(selectors.edgeApplication.mainSettings.modulesSwitch('loadBalancer')).click()
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your edge application has been updated')

    //add origin
    cy.get(selectors.edgeApplication.tabs('Origins')).click()
    cy.get(selectors.edgeApplication.origins.createButton).click()

    //act
    cy.get(selectors.edgeApplication.origins.nameInput).type(fixtures.originName)
    cy.get(selectors.edgeApplication.origins.originType).click()
    cy.get(selectors.edgeApplication.origins.originType)
      .find('li')
      .eq(1)
      .should('have.text', 'Load Balancer')
      .click()

    cy.get(selectors.edgeApplication.origins.addressesInput(0)).clear()
    cy.get(selectors.edgeApplication.origins.addressesInput(0)).type('test.com')
    cy.get(selectors.edgeApplication.origins.addressesInput(1)).clear()
    cy.get(selectors.edgeApplication.origins.addressesInput(1)).type('test2.com')
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.get('.p-component-overlay > .p-dialog > .p-dialog-header').should(
      'have.text',
      'Origin Key has been created'
    )
    cy.get(selectors.edgeApplication.origins.dialogCopyButton).click()
    cy.verifyToast('success', 'Your origin has been created')
    cy.verifyToast('Successfully copied!')
    cy.get(selectors.edgeApplication.origins.dialogCloseButton).click()

    //Assert
    cy.get(selectors.list.searchInput).type(`${fixtures.originName}{enter}`)
    cy.get(selectors.list.filteredRow.column('name')).should('have.text', fixtures.originName)

    //edit origin
    //arrange
    cy.intercept('GET', '/api/v3/edge_applications/*/origins/*').as('loadOrigins')
    cy.get(selectors.list.filteredRow.column('name')).click()

    //act
    cy.wait('@loadOrigins')
    cy.get(selectors.edgeApplication.origins.originType).click()
    cy.get(selectors.edgeApplication.origins.originType)
      .find('li')
      .eq(0)
      .should('have.text', 'Single Origin')
      .click()
    cy.get(selectors.edgeApplication.origins.originType).should('have.text', 'Single Origin')
    cy.get(selectors.edgeApplication.origins.addressInput).clear()
    cy.get(selectors.edgeApplication.origins.addressInput).type('test2.com')
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your Origin has been edited')
    cy.get(selectors.form.goBackButton).click()

    //assert
    cy.get(selectors.list.searchInput).clear()
    cy.get(selectors.list.searchInput).type(`${fixtures.originName}{enter}`)
    cy.get(selectors.list.filteredRow.column('name')).should('have.text', fixtures.originName)
  })
})