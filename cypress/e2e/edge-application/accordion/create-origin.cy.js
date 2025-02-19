import generateUniqueName from '../../../support/utils'
import selectors from '../../../support/selectors'

let fixtures = {
  originName: 'Default Origin'

}

describe('Edge Application', { tags: ['@dev4'] }, () => {
  beforeEach(() => {
    fixtures.edgeApplicationName = generateUniqueName('EdgeApp')
    // Login
    cy.login()

  })

  it('should add an origin', () => {
    //edge application creation
    cy.openProduct('Edge Application')
    
    cy.get(selectors.edgeApplication.mainSettings.createButton).click()
    cy.get(selectors.edgeApplication.mainSettings.nameInput).type(fixtures.edgeApplicationName)
    cy.intercept('POST', 'api/v4/edge_application/applications*').as('createEdgeApp')
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.wait('@createEdgeApp')
    cy.verifyToast('success', 'Your edge application has been created')

    cy.get(selectors.edgeApplication.accordionStepOrigin.createOrigin).click()
    cy.get(selectors.edgeApplication.accordionStepOrigin.addressOriginInput).type(`${fixtures.edgeApplicationName}.app.azion`)
    cy.intercept('POST', 'api/v3/edge_applications/*/origins').as('createOrigin')
    cy.get(selectors.form.createButtonAccordtion).first().click()
    cy.wait('@createOrigin')
    cy.verifyToast('success', 'Your origin has been created')
    cy.get(selectors.form.actionsSkipButton).click()
    cy.get(selectors.edgeApplication.mainSettings.unsaved).click()
    cy.get(selectors.edgeApplication.tabs('Origins')).click()

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
