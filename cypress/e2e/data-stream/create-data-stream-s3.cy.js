import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let dataStreamName

describe('Data Stream spec', { tags: ['@dev3', '@xfail'] }, () => {
  beforeEach(() => {
    dataStreamName = generateUniqueName('DataStream')

    cy.login()
    cy.openProduct('Data Stream')
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

  afterEach(() => {
    // Cleanup
    cy.deleteEntityFromList({ entityName: dataStreamName, productName: 'Data Stream' }).then(() => {
      cy.verifyToast('Data Stream successfully deleted')
    })
  })
})