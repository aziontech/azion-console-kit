import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let dataStreamName

describe('Data Stream spec', { tags: ['@dev2'] }, () => {
  beforeEach(() => {
    dataStreamName = generateUniqueName('DataStream')

    cy.login()
    cy.openProduct('Data Stream')
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

    cy.get(selectors.list.searchInput).type(`${dataStreamName}{enter}`)
    cy.get(selectors.dataStream.list.columnName('name')).should('have.text', dataStreamName)
    cy.get(selectors.dataStream.list.columnName('dataSource')).should(
      'have.text',
      'Edge Applications'
    )
    cy.get(selectors.dataStream.list.columnName('endpointType')).should(
      'have.text',
      'elasticsearch'
    )
    cy.get(selectors.dataStream.list.columnName('active')).should('have.text', 'Active')
  })
})
