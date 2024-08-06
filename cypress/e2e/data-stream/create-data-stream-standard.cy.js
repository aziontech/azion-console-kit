// cypress/integration/data-stream/create-data-stream-standard.spec.js
import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

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

  afterEach(() => {
    // Cleanup
    cy.deleteEntityFromList({ entityName: dataStreamName, productName: 'Data Stream' }).then(() => {
      cy.verifyToast('Data Stream successfully deleted')
    })
  })
})