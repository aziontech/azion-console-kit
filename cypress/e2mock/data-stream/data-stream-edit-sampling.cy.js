import selectors from '../../support/selectors'

describe('Data Stream Edit Sampling', { tags: ['@dev4'] }, () => {
  beforeEach(() => {
    cy.clearAllSessionStorage()
    cy.clearAllLocalStorage()
  })

  it('it should show warning dialog when editing a data stream with sampling flag enabled', () => {
    //Arrange
    cy.intercept('GET', '/api/account/info', {
      fixture: '/account/info/with_data_streaming_sampling_flag.json'
    }).as('accountInfo')
    cy.login()
    cy.wait('@accountInfo', { timeout: 30000 })
    cy.intercept('GET', '/api/v3/data_streaming/streamings', {
      fixture: '/data-streaming/list-all.json'
    }).as('dataStreamList')
    cy.openProduct('Data Stream')
    cy.wait('@dataStreamList', { timeout: 30000 })
    cy.intercept('GET', '/api/v3/data_streaming/streamings/12836', {
      fixture: '/data-streaming/with_sampling_active.json'
    }).as('retrieveDataStream')
    cy.intercept('GET', '/api/v3/data_streaming/templates', {
      fixture: '/data-streaming/data_stream_templates.json'
    }).as('getTemplates')
    cy.intercept('GET', '/api/v3/data_streaming/domains?streaming_id=12836&page_size=2000', {
      fixture: '/data-streaming/domains_by_data_stream.json'
    }).as('getDomainsById')

    //Act
    cy.get(selectors.dataStream.list.columnName('name')).first().click()
    cy.wait('@retrieveDataStream', { timeout: 30000 })
    cy.wait('@getDomainsById', { timeout: 30000 })
    cy.wait('@getTemplates', { timeout: 30000 })

    cy.get(selectors.dataStream.nameInput).should('have.value', 'joijoi')
    cy.get(selectors.form.actionsSubmitButton).click()

    //Assert
    cy.get(selectors.dataStream.sampling.samplingDialog).should('be.visible')
  })

  it('it should not show warning dialog when editing a data stream with sampling flag disabled', () => {
    //Arrange
    cy.intercept('GET', '/api/account/info', {
      fixture: '/account/info/without_data_streaming_sampling.json'
    }).as('accountInfo')
    cy.login()
    cy.wait('@accountInfo', { timeout: 30000 })
    cy.intercept('GET', '/api/v3/data_streaming/streamings', {
      fixture: '/data-streaming/list-all.json'
    }).as('dataStreamList')
    cy.openProduct('Data Stream')
    cy.wait('@dataStreamList', { timeout: 30000 })
    cy.intercept('GET', '/api/v3/data_streaming/streamings/12836', {
      fixture: '/data-streaming/with_sampling_active.json'
    }).as('retrieveDataStream')
    cy.intercept('GET', '/api/v3/data_streaming/templates', {
      fixture: '/data-streaming/data_stream_templates.json'
    }).as('getTemplates')
    cy.intercept('GET', '/api/v3/data_streaming/domains?streaming_id=12836&page_size=2000', {
      fixture: '/data-streaming/domains_by_data_stream.json'
    }).as('getDomainsById')

    //Act
    cy.get(selectors.dataStream.list.columnName('name')).first().click()
    cy.wait('@retrieveDataStream', { timeout: 30000 })
    cy.wait('@getDomainsById', { timeout: 30000 })
    cy.wait('@getTemplates', { timeout: 30000 })

    cy.get(selectors.dataStream.nameInput).should('have.value', 'joijoi')
    cy.intercept('PUT', '/api/v3/data_streaming/streamings/12836', {
      statusCode: 200
    }).as('updateDataStream')
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.wait('@updateDataStream', { timeout: 30000 })

    //Assert
    cy.verifyToast('success', 'Your data stream has been updated')
  })
})
