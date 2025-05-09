/* eslint-disable cypress/unsafe-to-chain-command */
import edgeConnectors from '../../support/selectors/product-selectors/edge-connectors'
import edgeConnectorsJSON from '../../fixtures/edge-connectors/create-edge-connectors.json'

describe('Create Edge Connectors spec', { tags: ['@dev3'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Edge Connectors')
  })

  it('should create a new Edge Connector type edge storage (mocked)', () => {
    cy.intercept(
      { method: 'POST', url: '/api/v4/edge_connector/connectors' },
      { body: edgeConnectorsJSON, statusCode: 202 }
    ).as('createEdgeConnector')


    cy.get(edgeConnectors.createButton).click()
    cy.get(edgeConnectors.name).clear()
    cy.get(edgeConnectors.name).type('edgeConnectorsMock')
    cy.get(edgeConnectors.typeDropdown).click()
    cy.get('#type_2').click()
    cy.get(edgeConnectors.edgeStorage.bucket)
      .clear()
      .type('advanced-filter-graphql')
    cy.get(edgeConnectors.edgeStorage.prefix)
      .clear()
      .type('20241010173031')
    cy.get(edgeConnectors.saveButton).click()

    // // 3. Verifica o alias e validações UI sem backend
    cy.wait('@createEdgeConnector')
      .its('response.body.data')
      .then((data) => {
        expect(data.type).to.equal('edge_storage')
        expect(data.type_properties.bucket).to.equal('advanced-filter-graphql')
      })
    cy.verifyToast('success', 'Edge Connector successfully created')
  })
})