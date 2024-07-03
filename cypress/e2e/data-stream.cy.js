import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

let dataStreamName

describe('Data Stream spec', () => {
  beforeEach(() => {
    dataStreamName = generateUniqueName('DataStream')

    cy.login()
    cy.openProductThroughSidebar('data-stream')
  })

  it('should create a data stream with the standard connector', () => {
    // Arrange
    cy.intercept('api/v3/data_streaming/templates').as('getTemplates')

    cy.get(selectors.dataStream.createButton).click()
    cy.wait('@getTemplates')

    // Act
    cy.get(selectors.dataStream.nameInput).type(dataStreamName)
    cy.get(selectors.dataStream.httpConnector.urlInput).type('https://hello.world')
    cy.get(selectors.dataStream.httpConnector.headersInput).type('header:value')

    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.verifyToast('success', 'Your data stream has been created')

    cy.get(selectors.list.searchInput).type(dataStreamName)
    cy.get(selectors.dataStream.list.columnName('name')).should('have.text', dataStreamName)
    cy.get(selectors.dataStream.list.columnName('dataSource')).should(
      'have.text',
      'Edge Applications'
    )
    cy.get(selectors.dataStream.list.columnName('templateName')).should(
      'have.text',
      'Template teste'
    )
    cy.get(selectors.dataStream.list.columnName('endpointType')).should('have.text', 'standard')
    cy.get(selectors.dataStream.list.columnName('active')).should('have.text', 'Active')
  })

  it('should create a data stream with the kafka connector', () => {
    // Arrange
    cy.intercept('api/v3/data_streaming/templates').as('getTemplates')

    const kafkaOption = 1

    cy.get(selectors.dataStream.createButton).click()
    cy.wait('@getTemplates')

    // Act
    cy.get(selectors.dataStream.nameInput).type(dataStreamName)
    cy.get(selectors.dataStream.connectorDropdown).click()
    cy.get(selectors.dataStream.connectorOption(kafkaOption)).click()
    cy.get(selectors.dataStream.kafkaConnector.serverTextarea).type('localhost:80')
    cy.get(selectors.dataStream.kafkaConnector.topicInput).type('cluster.test.pages.0')
    cy.get(selectors.dataStream.kafkaConnector.useTlsSlider).click()

    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.verifyToast('success', 'Your data stream has been created')

    cy.get(selectors.list.searchInput).type(dataStreamName)
    cy.get(selectors.dataStream.list.columnName('name')).should('have.text', dataStreamName)
    cy.get(selectors.dataStream.list.columnName('dataSource')).should(
      'have.text',
      'Edge Applications'
    )
    cy.get(selectors.dataStream.list.columnName('templateName')).should(
      'have.text',
      'Template teste'
    )
    cy.get(selectors.dataStream.list.columnName('endpointType')).should('have.text', 'kafka')
    cy.get(selectors.dataStream.list.columnName('active')).should('have.text', 'Active')
  })

  it('should create a data stream with the s3 connector', () => {
    // Arrange
    cy.intercept('api/v3/data_streaming/templates').as('getTemplates')

    const s3Option = 2

    cy.get(selectors.dataStream.createButton).click()
    cy.wait('@getTemplates')

    // Act
    cy.get(selectors.dataStream.nameInput).type(dataStreamName)
    cy.get(selectors.dataStream.connectorDropdown).click()
    cy.get(selectors.dataStream.connectorOption(s3Option)).click()

    cy.get(selectors.dataStream.s3Connector.urlInput).type(
      'https://myownhost.s3.us-east-1.myprovider.com'
    )
    cy.get(selectors.dataStream.s3Connector.bucketInput).type('mys3bucket')
    cy.get(selectors.dataStream.s3Connector.regionInput).type('us-east-1')
    cy.get(selectors.dataStream.s3Connector.accessKeyInput).type('ORIA5ZEH9MW4NL5OITY4')
    cy.get(selectors.dataStream.s3Connector.secretKeyInput).type(
      '+PLjkUWJyOLth3anuWXcLLVrMLeiiiThIokaPEiw'
    )
    cy.get(selectors.dataStream.s3Connector.objectKeyPrefixInput).type(
      'waf_logs_1622575860091_37d66e78-c308-4006-9d4d-1c013ed89276'
    )

    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.verifyToast('success', 'Your data stream has been created')

    cy.get(selectors.list.searchInput).type(dataStreamName)
    cy.get(selectors.dataStream.list.columnName('name')).should('have.text', dataStreamName)
    cy.get(selectors.dataStream.list.columnName('dataSource')).should(
      'have.text',
      'Edge Applications'
    )
    cy.get(selectors.dataStream.list.columnName('templateName')).should(
      'have.text',
      'Template teste'
    )
    cy.get(selectors.dataStream.list.columnName('endpointType')).should('have.text', 's3')
    cy.get(selectors.dataStream.list.columnName('active')).should('have.text', 'Active')
  })

  it('should create a data stream with the bigquery connector', () => {
    // Arrange
    cy.intercept('api/v3/data_streaming/templates').as('getTemplates')

    const bigqueryOption = 3

    cy.get(selectors.dataStream.createButton).click()
    cy.wait('@getTemplates')

    // Act
    cy.get(selectors.dataStream.nameInput).type(dataStreamName)
    cy.get(selectors.dataStream.connectorDropdown).click()
    cy.get(selectors.dataStream.connectorOption(bigqueryOption)).click()

    cy.get(selectors.dataStream.bigQueryConnector.projectIdInput).type('mycustomGBQproject01')
    cy.get(selectors.dataStream.bigQueryConnector.datasetIdInput).type('myGBQdataset')
    cy.get(selectors.dataStream.bigQueryConnector.tableIdInput).type('mypagaviewtable01')
    cy.get(selectors.dataStream.bigQueryConnector.serviceAccountKeyInput).type('{}')

    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.verifyToast('success', 'Your data stream has been created')

    cy.get(selectors.list.searchInput).type(dataStreamName)
    cy.get(selectors.dataStream.list.columnName('name')).should('have.text', dataStreamName)
    cy.get(selectors.dataStream.list.columnName('dataSource')).should(
      'have.text',
      'Edge Applications'
    )
    cy.get(selectors.dataStream.list.columnName('templateName')).should(
      'have.text',
      'Template teste'
    )
    cy.get(selectors.dataStream.list.columnName('endpointType')).should('have.text', 'big_query')
    cy.get(selectors.dataStream.list.columnName('active')).should('have.text', 'Active')
  })

  it('should create a data stream with the elasticsearch connector', () => {
    // Arrange
    cy.intercept('api/v3/data_streaming/templates').as('getTemplates')

    const elasticsearchOption = 4

    cy.get(selectors.dataStream.createButton).click()
    cy.wait('@getTemplates')

    // Act
    cy.get(selectors.dataStream.nameInput).type(dataStreamName)
    cy.get(selectors.dataStream.connectorDropdown).click()
    cy.get(selectors.dataStream.connectorOption(elasticsearchOption)).click()

    cy.get(selectors.dataStream.elasticsearchConnector.urlInput).type(
      'https://elasticsearch-domain.com/myindex'
    )
    cy.get(selectors.dataStream.elasticsearchConnector.apiKeyTextarea).type(
      'VuaCfGcBCdbkQm-e5aOx:ui2lp2axTNmsyakw9tvNnw'
    )

    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.verifyToast('success', 'Your data stream has been created')

    cy.get(selectors.list.searchInput).type(dataStreamName)
    cy.get(selectors.dataStream.list.columnName('name')).should('have.text', dataStreamName)
    cy.get(selectors.dataStream.list.columnName('dataSource')).should(
      'have.text',
      'Edge Applications'
    )
    cy.get(selectors.dataStream.list.columnName('templateName')).should(
      'have.text',
      'Template teste'
    )
    cy.get(selectors.dataStream.list.columnName('endpointType')).should(
      'have.text',
      'elasticsearch'
    )
    cy.get(selectors.dataStream.list.columnName('active')).should('have.text', 'Active')
  })

  it.only('should create a data stream with the splunk connector', () => {
    // Arrange
    cy.intercept('api/v3/data_streaming/templates').as('getTemplates')

    const splunkOption = 5

    cy.get(selectors.dataStream.createButton).click()
    cy.wait('@getTemplates')

    // Act
    cy.get(selectors.dataStream.nameInput).type(dataStreamName)
    cy.get(selectors.dataStream.connectorDropdown).click()
    cy.get(selectors.dataStream.connectorOption(splunkOption)).click()

    cy.get(selectors.dataStream.splunkConnector.urlInput).type(
      'https://inputs.splunk-client.splunkcloud.com:123456/services/collector'
    )
    cy.get(selectors.dataStream.splunkConnector.apiKeyTextarea).type(
      'crfe25d2-23j8-48gf-a9ks-6b75w3ska674'
    )

    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.verifyToast('success', 'Your data stream has been created')

    cy.get(selectors.list.searchInput).type(dataStreamName)
    cy.get(selectors.dataStream.list.columnName('name')).should('have.text', dataStreamName)
    cy.get(selectors.dataStream.list.columnName('dataSource')).should(
      'have.text',
      'Edge Applications'
    )
    cy.get(selectors.dataStream.list.columnName('templateName')).should(
      'have.text',
      'Template teste'
    )
    cy.get(selectors.dataStream.list.columnName('endpointType')).should('have.text', 'splunk')
    cy.get(selectors.dataStream.list.columnName('active')).should('have.text', 'Active')
  })

  afterEach(() => {
    // Cleanup
    cy.deleteProduct(dataStreamName, '/data-stream').then(() => {
      cy.verifyToast('Data Stream successfully deleted')
    })
  })
})
