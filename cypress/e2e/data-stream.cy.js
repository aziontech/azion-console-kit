import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

let dataStreamName

describe('Data Stream spec', { tags: ['@xfail'] }, () => {
  beforeEach(() => {
    dataStreamName = generateUniqueName('DataStream')

    cy.login()
    cy.openProduct('Data Stream')
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

  it('should create a data stream with the splunk connector', () => {
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

  it('should create a data stream with the awsKinesis connector', () => {
    // Arrange
    cy.intercept('api/v3/data_streaming/templates').as('getTemplates')

    const awsKinesisOption = 6

    cy.get(selectors.dataStream.createButton).click()
    cy.wait('@getTemplates')

    // Act
    cy.get(selectors.dataStream.nameInput).type(dataStreamName)
    cy.get(selectors.dataStream.connectorDropdown).click()
    cy.get(selectors.dataStream.connectorOption(awsKinesisOption)).click()

    cy.get(selectors.dataStream.awsKinesisConnector.streamNameInput).type('MyKDFConnector')
    cy.get(selectors.dataStream.awsKinesisConnector.regionInput).type('us-east-1')
    cy.get(selectors.dataStream.awsKinesisConnector.accessKeyInput).type('ORIA5ZEH9MW4NL5OITY4')
    cy.get(selectors.dataStream.awsKinesisConnector.secretKeyInput).type(
      '+PLjkUWJyOLth3anuWXcLLVrMLeiiiThIokaPEiw'
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
      'aws_kinesis_firehose'
    )
    cy.get(selectors.dataStream.list.columnName('active')).should('have.text', 'Active')
  })

  it('should create a data stream with the datadog connector', () => {
    // Arrange
    cy.intercept('api/v3/data_streaming/templates').as('getTemplates')

    const datadogOption = 7

    cy.get(selectors.dataStream.createButton).click()
    cy.wait('@getTemplates')

    // Act
    cy.get(selectors.dataStream.nameInput).type(dataStreamName)
    cy.get(selectors.dataStream.connectorDropdown).click()
    cy.get(selectors.dataStream.connectorOption(datadogOption)).click()

    cy.get(selectors.dataStream.datadogConnector.urlInput).type(
      'https://http-intake.logs.datadoghq.com/v1/input'
    )
    cy.get(selectors.dataStream.datadogConnector.apiKeyTextarea).type(
      'ij9076f1ujik17a81f938yhru5g713422'
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
    cy.get(selectors.dataStream.list.columnName('endpointType')).should('have.text', 'datadog')
    cy.get(selectors.dataStream.list.columnName('active')).should('have.text', 'Active')
  })

  it('should create a data stream with the ibmQRadar connector', () => {
    // Arrange
    cy.intercept('api/v3/data_streaming/templates').as('getTemplates')

    const ibmQRadarOption = 8

    cy.get(selectors.dataStream.createButton).click()
    cy.wait('@getTemplates')

    // Act
    cy.get(selectors.dataStream.nameInput).type(dataStreamName)
    cy.get(selectors.dataStream.connectorDropdown).click()
    cy.get(selectors.dataStream.connectorOption(ibmQRadarOption)).click()

    cy.get(selectors.dataStream.ibmQRadarConnector.urlInput).type('http://137.15.824.10:14440')

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
    cy.get(selectors.dataStream.list.columnName('endpointType')).should('have.text', 'qradar')
    cy.get(selectors.dataStream.list.columnName('active')).should('have.text', 'Active')
  })

  it('should create a data stream with the azureMonitor connector', () => {
    // Arrange
    cy.intercept('api/v3/data_streaming/templates').as('getTemplates')

    const azureMonitorOption = 9

    cy.get(selectors.dataStream.createButton).click()
    cy.wait('@getTemplates')

    // Act
    cy.get(selectors.dataStream.nameInput).type(dataStreamName)
    cy.get(selectors.dataStream.connectorDropdown).click()
    cy.get(selectors.dataStream.connectorOption(azureMonitorOption)).click()

    cy.get(selectors.dataStream.azureMonitorConnector.logTypeInput).type('AzureMonitorTest')
    cy.get(selectors.dataStream.azureMonitorConnector.sharedKeyInput).type(
      'OiA9AdGr4As5Iujg5FAHsTWfawxOD4'
    )
    cy.get(selectors.dataStream.azureMonitorConnector.timeGeneratedFieldInput).type(
      'myCustomTimeField'
    )
    cy.get(selectors.dataStream.azureMonitorConnector.workspaceIdInput).type(
      'kik73154-0426-464c-aij3-eg6d24u87c50'
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
      'azure_monitor'
    )
    cy.get(selectors.dataStream.list.columnName('active')).should('have.text', 'Active')
  })

  it('should create a data stream with the azureBlobStorage connector', () => {
    // Arrange
    cy.intercept('api/v3/data_streaming/templates').as('getTemplates')

    const azureBlobStorageOption = 10

    cy.get(selectors.dataStream.createButton).click()
    cy.wait('@getTemplates')

    // Act
    cy.get(selectors.dataStream.nameInput).type(dataStreamName)
    cy.get(selectors.dataStream.connectorDropdown).click()
    cy.get(selectors.dataStream.connectorOption(azureBlobStorageOption)).click()

    cy.get(selectors.dataStream.azureBlobStorageConnector.storageAccountInput).type(
      'mystorageaccount'
    )
    cy.get(selectors.dataStream.azureBlobStorageConnector.containerNameInput).type('mycontainer')
    cy.get(selectors.dataStream.azureBlobStorageConnector.blobSasTokenInput).type(
      'sp=oiuwdl&st=2022-04-14T18:05:08Z&se=2026-03-02T02:05:08Z&sv=2020-08-04&sr=c&sig=YUi0TBEt7XTlxXex4Jui%2Fc88h6qAgMmCY4XIXeMvxa0%3F'
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
      'azure_blob_storage'
    )
    cy.get(selectors.dataStream.list.columnName('active')).should('have.text', 'Active')
  })

  afterEach(() => {
    // Cleanup
    cy.deleteEntityFromList({ entityName: dataStreamName, productName: 'Data Stream' }).then(() => {
      cy.verifyToast('Data Stream successfully deleted')
    })
  })
})
