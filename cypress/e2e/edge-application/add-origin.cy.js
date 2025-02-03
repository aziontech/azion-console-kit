import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let fixtures = {
  originName: 'Default Origin'
}

/**
 * Creates a new edge application with basic settings.
 */
const createEdgeApplicationCase = () => {
  // Act
  cy.get(selectors.edgeApplication.mainSettings.createButton).click()
  cy.get(selectors.edgeApplication.mainSettings.nameInput).type(fixtures.edgeApplicationName)
  cy.intercept('POST', 'api/v4/edge_application/applications*').as('createEdgeApp')
  cy.get(selectors.form.actionsSubmitButton).click()
  cy.wait('@createEdgeApp')
  cy.verifyToast('success', 'Your edge application has been created')
  cy.get(selectors.form.actionsSkipButton).click()
  cy.get(selectors.edgeApplication.mainSettings.unsaved).click()
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

    fixtures = {
      functionName: generateUniqueName('EdgeFunction'),
      functionInstanceName: generateUniqueName('FunctionsInstance'),
      edgeApplicationName: generateUniqueName('EdgeApp'),
      originName: generateUniqueName('origin'),
      rulesEngineName: generateUniqueName('RulesEng'),
      cacheSettingName: generateUniqueName('cacheSetting')
    }
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
    cy.get('.p-component-overlay > .p-dialog > .p-dialog-header').should('have.text', 'Origin Key has been created')
    cy.get(selectors.edgeApplication.origins.dialogCopyButton).click()
    cy.verifyToast('success', 'Your origin has been created')
    cy.verifyToast('Successfully copied!')
    cy.get(selectors.edgeApplication.origins.dialogCloseButton).click()

    //Assert
    cy.get(selectors.list.searchInput).type(`${fixtures.originName}{enter}`)
    cy.get(selectors.list.filteredRow.column('name')).should('have.text', fixtures.originName)
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
