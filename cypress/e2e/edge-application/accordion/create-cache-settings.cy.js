import generateUniqueName from '../../../support/utils'
import selectors from '../../../support/selectors'

let fixtures = {
  cacheName: 'Default Cache Settings'

}

describe('Edge Application', { tags: ['@dev4'] }, () => {
  beforeEach(() => {
    fixtures.edgeApplicationName = generateUniqueName('EdgeApp')
    // Login
    cy.login()

  })

  it('should add an cache settings', () => {
    //edge application creation
    cy.openProduct('Edge Application')
    
    cy.get(selectors.edgeApplication.mainSettings.createButton).click()
    cy.get(selectors.edgeApplication.mainSettings.nameInput).type(fixtures.edgeApplicationName)
    cy.intercept('POST', 'api/v4/edge_application/applications*').as('createEdgeApp')
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.wait('@createEdgeApp')
    cy.verifyToast('success', 'Your edge application has been created')

    cy.get(selectors.edgeApplication.accordionStepCache.createCache).click()
    cy.get(selectors.edgeApplication.accordionStepCache.browserCacheSettings).click()
    cy.intercept('POST', 'api/v4/edge_application/applications/*/cache_settings').as('createCache')
    cy.get(selectors.form.createButtonAccordtion).eq(2).click()
    cy.wait('@createCache')
    cy.verifyToast('success', 'Cache Settings successfully created')
    cy.get(selectors.form.actionsSkipButton).click()
    cy.get(selectors.edgeApplication.mainSettings.unsaved).click()
    cy.get(selectors.edgeApplication.tabs('Cache Settings')).click()

    //Assert
    cy.get(selectors.list.searchInput).type(`${fixtures.cacheName}{enter}`)
    cy.get(selectors.list.filteredRow.column('name')).should('have.text', fixtures.cacheName)
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
