import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let dataStreamName

describe('Data Stream spec', { tags: ['@dev3'] }, () => {
  beforeEach(() => {
    dataStreamName = generateUniqueName('DataStream')

    cy.login()
    cy.openProduct('Data Stream')
  })

  it('should create a data stream with the splunk connector', () => {
    // Arrange
    cy.intercept('/v4/data_stream/templates?page=1&page_size=100&fields=id%2Cname').as('getTemplates')

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

    cy.get(selectors.list.searchInput).type(`${dataStreamName}{enter}`)
    cy.get(selectors.dataStream.list.columnName('name')).should('have.text', dataStreamName)
    cy.get(selectors.dataStream.list.columnName('dataSource')).should(
      'have.text',
      'Edge Applications'
    )
    cy.get(selectors.dataStream.list.columnName('endpointType')).should('have.text', 'splunk')
    cy.get(selectors.dataStream.list.columnName('active')).should('have.text', 'Active')
  })
})
