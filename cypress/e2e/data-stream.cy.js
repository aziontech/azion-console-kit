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
    cy.get(selectors.dataStream.createButton).click()

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

  afterEach(() => {
    // Cleanup
    cy.deleteProduct(dataStreamName, '/data-stream').then(() => {
      cy.verifyToast('Data Stream successfully deleted')
    })
  })
})
