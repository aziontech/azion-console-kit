import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

let dataStreamName

describe('Data Stream spec', () => {
  beforeEach(() => {
    dataStreamName = generateUniqueName('DataStream')

    cy.login()
    cy.openProductThroughSidebar('data-stream')
  })

  it('should create and delete a data stream with the standard connector', () => {
    // Arrange
    cy.get(selectors.dataStream.createButton).click()

    // Act
    cy.get(selectors.dataStream.nameInput).type(dataStreamName)

    cy.get(selectors.dataStream.sourceDropdown).should('have.text', 'Edge Applications')
    cy.get(selectors.dataStream.templateDropdown).should('have.text', 'Template teste')
    cy.get(selectors.dataStream.editorBody).should('not.be.empty')

    cy.get(selectors.dataStream.connectorDropdown).should('have.text', 'Standard HTTP/HTTPS POST')
    cy.get(selectors.dataStream.httpConnector.urlInput).type('https://hello.world')
    cy.get(selectors.dataStream.httpConnector.headersInput).type('header:value')
    cy.get(selectors.dataStream.httpConnector.payloadInput).should('have.value', '$dataset')
    cy.get(selectors.dataStream.httpConnector.separatorInput).should('have.value', '\\n')
    cy.get(selectors.dataStream.httpConnector.maxSizeInput).should('have.value', '1000000')

    cy.get(selectors.dataStream.statusSlider).should('have.attr', 'aria-checked', 'true')

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
