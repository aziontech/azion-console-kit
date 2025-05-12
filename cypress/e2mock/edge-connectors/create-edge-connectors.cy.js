/* eslint-disable cypress/unsafe-to-chain-command */
import edgeConnectors from '../../support/selectors/product-selectors/edge-connectors'
import generateUniqueName from '../../support/utils'

import edgeConnectorsJSON from '../../fixtures/edge-connectors/create-edge-connectors.json'
import accountInfoJSON from '../../fixtures/edge-connectors/account-info.json'

let edgeConnectorName

const mockRequestAccountInfo = () => {
  edgeConnectorName = generateUniqueName('EdgeConnector')

  cy.intercept(
    { method: 'GET', url: '/api/account/info' },
    {
      statusCode: 200,
      body: accountInfoJSON
    }
  ).as('getAccountInfo')
}

describe('Create Edge Connectors spec', { tags: ['@dev3'] }, () => {
  beforeEach(() => {
    cy.login()
    mockRequestAccountInfo()

    cy.openProduct('Edge Connectors')
    cy.intercept('api/v4/edge_connector/connectors').as('createEdgeConnector')
  })

  it('should create a new Edge Connector type http', () => {
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

    cy.wait('@createEdgeConnector').its('response.statusCode').should('eq', 202)

    cy.verifyToast('success', 'Edge Connector successfully created')
  })

  it('should create a new Edge Connector type s3', () => {
    cy.intercept('api/v4/edge_connector/connectors').as('createEdgeConnector')

    cy.get(edgeConnectors.createButton).click()
    cy.get(edgeConnectors.name).clear()
    cy.get(edgeConnectors.name).type(edgeConnectorName)

    cy.get(edgeConnectors.typeDropdown).click()
    cy.get('#type_1').click()
    cy.get(edgeConnectors.s3.host).clear()
    cy.get(edgeConnectors.s3.host).type('api.grando.com')
    cy.get(edgeConnectors.s3.bucket).clear()
    cy.get(edgeConnectors.s3.bucket).type('azion-statics')
    cy.get(edgeConnectors.s3.path).clear()
    cy.get(edgeConnectors.s3.path).type('/imgs/')
    cy.get(edgeConnectors.s3.region).clear()
    cy.get(edgeConnectors.s3.region).type('us-east-1')
    cy.get(edgeConnectors.s3.accessKey).clear()
    cy.get(edgeConnectors.s3.accessKey).type('${{}env.S3_ACCESSKEY}')
    cy.get(edgeConnectors.s3.secretKey).clear()
    cy.get(edgeConnectors.s3.secretKey).type('${{}env.S3_SECRETKEY}')
    cy.get(edgeConnectors.address).clear()
    cy.get(edgeConnectors.address).type('www.google.com')
    cy.get(edgeConnectors.saveButton).click()

    cy.wait('@createEdgeConnector').its('response.statusCode').should('eq', 202)

    cy.verifyToast('success', 'Edge Connector successfully created')
  })

  it.only('should create a new Edge Connector type live ingest', () => {
    cy.intercept('api/v4/edge_connector/connectors').as('createEdgeConnector')

    cy.get(edgeConnectors.createButton).click()
    cy.get(edgeConnectors.name).clear()
    cy.get(edgeConnectors.name).type(edgeConnectorName)
    cy.get(edgeConnectors.typeDropdown).click()
    cy.get('#type_3').click()
    cy.get(edgeConnectors.liveIngest.endpoint).clear()
    cy.get(edgeConnectors.liveIngest.endpoint).type('us-east-1.azioningest.net')
    cy.get(edgeConnectors.saveButton).click()

    cy.wait('@createEdgeConnector').its('response.statusCode').should('eq', 202)

    cy.verifyToast('success', 'Edge Connector successfully created')
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