import edgeConnectors from '../../support/selectors/product-selectors/edge-connectors'
import generateUniqueName from '../../support/utils'

let edgeConnectorName

const createNewEdgeConnectorHttpType = () => {
  cy.intercept('api/v4/edge_connector/connectors').as('createEdgeConnector')

  cy.get(edgeConnectors.createButton).click()
  cy.get(edgeConnectors.name).clear()
  cy.get(edgeConnectors.name).type(edgeConnectorName)
  cy.get(edgeConnectors.http.host).clear()
  cy.get(edgeConnectors.http.host).type('www.google.com')
  cy.get(edgeConnectors.http.path).clear()
  cy.get(edgeConnectors.http.path).type('/')
  cy.get(edgeConnectors.http.realIpHeader).clear()
  cy.get(edgeConnectors.http.realIpHeader).type('192.168.60.98')
  cy.get(edgeConnectors.http.realPortHeader).clear()
  cy.get(edgeConnectors.http.realPortHeader).type('1989')
  cy.get(edgeConnectors.address).clear()
  cy.get(edgeConnectors.address).type('www.google.com')
  cy.get(edgeConnectors.saveButton).click()

  cy.wait('@createEdgeConnector')

  cy.verifyToast('success', 'Edge Connector successfully created')
}

describe('Create Edge Connectors spec', { tags: ['@dev3'] }, () => {
  before(() => {
    edgeConnectorName = generateUniqueName('EdgeConnector')
    cy.login()
    cy.openProduct('Edge Connectors')
  })

  it('should edit a Edge Connector type http', () => {
    cy.intercept('api/v4/edge_connector/connectors/*').as('editEdgeConnector')
    createNewEdgeConnectorHttpType()

    cy.get('[data-testid="data-table-search-input"]').clear()
    cy.get('[data-testid="data-table-search-input"]').type(`${edgeConnectorName}{enter}`)

    cy.get(edgeConnectors.tableRow).click()
    cy.get(edgeConnectors.http.path).clear()
    cy.get(edgeConnectors.http.path).type('/teste')
    cy.get(edgeConnectors.http.realIpHeader).clear('192.168.60.9')
    cy.get(edgeConnectors.http.realIpHeader).type('192.168.60.99')
    cy.get(edgeConnectors.http.realPortHeader).clear()
    cy.get(edgeConnectors.http.realPortHeader).type('5432')

    cy.get(edgeConnectors.http.followingRedirect).click()
    cy.get(edgeConnectors.tlsPolicyOption2).click()
    cy.get(edgeConnectors.productVersion).clear()
    cy.get(edgeConnectors.productVersion).type('2.0')
    cy.get(edgeConnectors.address).clear()
    cy.get(edgeConnectors.address).type('www.google1.com')
    cy.get(edgeConnectors.connectionTimeout).clear()
    cy.get(edgeConnectors.connectionTimeout).type('300')
    cy.get(edgeConnectors.maxRetries).clear()
    cy.get(edgeConnectors.maxRetries).type('1')
    cy.get(edgeConnectors.saveButton).click()

    cy.wait('@editEdgeConnector')

    cy.verifyToast('success', 'Edge Connector has been updated')
  })
})