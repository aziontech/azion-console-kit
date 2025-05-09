import edgeConnectors from '../../support/selectors/product-selectors/edge-connectors'
import generateUniqueName from '../../support/utils'

let edgeConnectorName

describe('Create Edge Connectors spec', { tags: ['@dev3'] }, () => {
  beforeEach(() => {
    edgeConnectorName = generateUniqueName('EdgeConnector')
    cy.login()
    cy.openProduct('Edge Connectors')
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

    cy.wait('@createEdgeConnector')

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

    cy.wait('@createEdgeConnector')

    cy.verifyToast('success', 'Edge Connector successfully created')
  })

  it('should create a new Edge Connector type edge storange', () => {
    cy.intercept('api/v4/edge_connector/connectors').as('createEdgeConnector')

    cy.get(edgeConnectors.createButton).click()
    cy.get(edgeConnectors.name).clear()
    cy.get(edgeConnectors.name).type(edgeConnectorName)
    cy.get(edgeConnectors.typeDropdown).click()
    cy.get('#type_2').click()
    cy.get(edgeConnectors.edgeStorage.bucket).clear()
    cy.get(edgeConnectors.edgeStorage.bucket).type('advanced-filter-graphql')
    cy.get(edgeConnectors.edgeStorage.prefix).clear()
    cy.get(edgeConnectors.edgeStorage.prefix).type('20241010173031')
    cy.get(edgeConnectors.saveButton).click()

    cy.wait('@createEdgeConnector')

    cy.verifyToast('success', 'Edge Connector successfully created')
  })

  it('should create a new Edge Connector type live ingest', () => {
    cy.intercept('api/v4/edge_connector/connectors').as('createEdgeConnector')

    cy.get(edgeConnectors.createButton).click()
    cy.get(edgeConnectors.name).clear()
    cy.get(edgeConnectors.name).type(edgeConnectorName)
    cy.get(edgeConnectors.typeDropdown).click()
    cy.get('#type_3').click()
    cy.get(edgeConnectors.liveIngest.endpoint).clear()
    cy.get(edgeConnectors.liveIngest.endpoint).type('us-east-1.azioningest.net')
    cy.get(edgeConnectors.saveButton).click()

    cy.wait('@createEdgeConnector')

    cy.verifyToast('success', 'Edge Connector successfully created')
  })

  it('should check the entered fields to see if they match the API response.', () => {
    cy.intercept('api/v4/edge_connector/connectors').as('createEdgeConnector')

    cy.intercept('api/v4/edge_connector/connectors').as('createEdgeConnector')

    cy.get(edgeConnectors.createButton).click()
    cy.get(edgeConnectors.name).clear()
    cy.get(edgeConnectors.name).type(edgeConnectorName)
    cy.get(edgeConnectors.typeDropdown).click()
    cy.get('#type_3').click()
    cy.get(edgeConnectors.liveIngest.endpoint).clear()
    cy.get(edgeConnectors.liveIngest.endpoint).type('us-east-1.azioningest.net')
    cy.get(edgeConnectors.saveButton).click()

    cy.wait('@createEdgeConnector').then(({ response }) => {
      const data = response.body.data

      expect(data.name).to.equal(edgeConnectorName)
      expect(data.type).to.equal('live_ingest')
      expect(data.type_properties.endpoint).to.equal('us-east-1.azioningest.net')
      expect(data.load_balance_method).to.equal('off')
      expect(data.modules).to.deep.equal({ load_balancer_enabled: true, origin_shield_enabled: true })
      expect(data.tls).to.deep.equal({ policy: 'preserve' })
      expect(data.product_version).to.equal('1.0')
      expect(data.connection_timeout).to.equal(60)
      expect(data.read_write_timeout).to.equal(120)
      expect(data.max_retries).to.equal(0)
      expect(data.active).to.equal(true)
      expect(data.addresses).to.be.an('array').that.is.empty
    })

    cy.verifyToast('success', 'Edge Connector successfully created')
  })
})
