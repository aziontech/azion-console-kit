import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let dataStreamName

describe('Data Stream spec', { tags: ['@dev2'] }, () => {
  beforeEach(() => {
    dataStreamName = generateUniqueName('DataStream')

    cy.login()
    cy.openProduct('Data Stream')
  })

  it('should create a data stream with the awsKinesis connector', () => {
    // Arrange
    cy.intercept('/v4/data_stream/templates?page=1&page_size=100&fields=id%2Cname').as('getTemplates')

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

    cy.get(selectors.list.searchInput).type(`${dataStreamName}{enter}`)
    cy.get(selectors.dataStream.list.columnName('name')).should('have.text', dataStreamName)
    cy.get(selectors.dataStream.list.columnName('dataSource')).should(
      'have.text',
      'Edge Applications'
    )
    cy.get(selectors.dataStream.list.columnName('endpointType')).should(
      'have.text',
      'aws_kinesis_firehose'
    )
    cy.get(selectors.dataStream.list.columnName('active')).should('have.text', 'Active')
  })
})
