import generateUniqueName from '../../../support/utils.js'
import selectors from '../../../support/selectors.js'
import { httpResponse } from '../../../fixtures/edge-connectors/create-edge-connectors.js'

let fixtures = {
  originName: 'Default Origin',
  edgeConnectorName: ''

}

describe('Edge Application', { tags: ['@dev4'] }, () => {
  beforeEach(() => {
    fixtures.edgeApplicationName = generateUniqueName('EdgeApp')
    fixtures.edgeConnectorName = generateUniqueName('EdgeConnector')
    cy.intercept('GET', '/api/account/info', {
      fixture: '/account/info/without_flags.json'
    }).as('accountInfo')
    // Login
    cy.login()

  })

  it('should add an edge connector', () => {
    //edge application creation
    cy.openProduct('Edge Application')
    
    cy.get(selectors.edgeApplication.mainSettings.createButton).click()
    cy.get(selectors.edgeApplication.mainSettings.nameInput).type(fixtures.edgeApplicationName)
    cy.intercept('POST', 'api/v4/edge_application/applications*').as('createEdgeApp')
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.wait('@createEdgeApp')
    cy.verifyToast('success', 'Your edge application has been created')

    cy.get(selectors.edgeApplication.accordionStepEdgeConnector.createEdgeConnector).click()
    cy.get(selectors.edgeConnector.name).clear()
    cy.get(selectors.edgeConnector.name).type(fixtures.edgeConnectorName)
    cy.get(selectors.edgeConnector.http.host).clear()
    cy.get(selectors.edgeConnector.http.host).type('www.google.com')
    cy.get(selectors.edgeConnector.http.path).clear()
    cy.get(selectors.edgeConnector.http.path).type('/')
    cy.get(selectors.edgeConnector.http.realIpHeader).clear()
    cy.get(selectors.edgeConnector.http.realIpHeader).type('192.168.60.98')
    cy.get(selectors.edgeConnector.http.realPortHeader).clear()
    cy.get(selectors.edgeConnector.http.realPortHeader).type('1989')
    cy.get(selectors.edgeConnector.address).clear()
    cy.get(selectors.edgeConnector.address).type('www.google.com')
    cy.intercept(
      { method: 'POST', url: '/api/v4/edge_connector/connectors' },
      { body: httpResponse, statusCode: 202 }
    ).as('createEdgeConnector')
    cy.get(selectors.form.createButtonAccordtion).first().click()
    cy.wait('@createEdgeConnector')
    cy.verifyToast('success', 'Edge Connector successfully created')

    cy.get(selectors.form.actionsSkipButton).click()
    cy.get(selectors.edgeApplication.mainSettings.unsaved).click()
  })
})
