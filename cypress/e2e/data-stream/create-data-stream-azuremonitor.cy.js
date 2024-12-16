import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let dataStreamName

describe('Data Stream spec', { tags: ['@dev2'] }, () => {
  beforeEach(() => {
    dataStreamName = generateUniqueName('DataStream')

    cy.login()
    cy.openProduct('Data Stream')
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

    cy.get(selectors.list.searchInput).type(`${dataStreamName}{enter}`)
    cy.get(selectors.dataStream.list.columnName('name')).should('have.text', dataStreamName)
    cy.get(selectors.dataStream.list.columnName('dataSource')).should(
      'have.text',
      'Edge Applications'
    )
    cy.get(selectors.dataStream.list.columnName('endpointType')).should(
      'have.text',
      'azure_monitor'
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
