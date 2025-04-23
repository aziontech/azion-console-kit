// cypress/e2e/data-stream/data-stream-create.cy.js
import selectors from '../../support/selectors'
import generateUniqueName from '../../support/utils'

let dataStreamName

describe('Data Stream Creation - Filter Domains Flow', { tags: ['@dev4'] }, () => {
  beforeEach(() => {
    dataStreamName = generateUniqueName('DataStream')

    cy.clearAllSessionStorage()
    cy.clearAllLocalStorage()
  })

  it('should successfully create a data stream with domain filters', () => {
    // Arrange - Set up API intercepts and log in
    cy.intercept('GET', '/api/account/info', {
      fixture: '/account/info/with_data_streaming_sampling_flag.json'
    }).as('accountInfo')
    
    cy.login()
    cy.wait('@accountInfo', { timeout: 30000 })

    cy.intercept('GET', '/api/v4/data_stream/data_sets*', {
      fixture: '/data-streaming/data_stream_templates.json'
    }).as('getTemplates')

    cy.intercept('GET', '/api/v4/workspace/workloads?ordering=id&page=1&page_size=1&fields=id&search=')
      .as('getOneWorkload')

    cy.intercept('GET', '/v4/data_stream/streams?ordering=name&page=1&page_size=10&fields=id%2Cname%2Cdata_source%2Cactive%2Cdata_set_id%2Cendpoint&search=', {
      fixture: '/data-streaming/list-all.json'
    }).as('dataStreamList')

    cy.intercept('GET', '/api/v4/workspace/workloads?ordering=name&page=1&page_size=100&fields=id%2C+name&search=', {
      fixture: '/data-streaming/workloadsFirstPage.json'
    }).as('getDomains')

    cy.openProduct('Data Stream')
    cy.wait('@dataStreamList', { timeout: 30000 })
    cy.wait('@getOneWorkload')

    cy.intercept('GET', '/api/v3/data_streaming/streamings/12836', {
      fixture: '/data-streaming/with_sampling_active.json'
    }).as('retrieveDataStream')

    // Act - Begin creation process
    cy.get(selectors.dataStream.createButton).click()
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000)
    cy.wait('@getDomains', { timeout: 30000 })

    // Fill in the stream name and open domain filter
    cy.get(selectors.dataStream.nameInput).type(dataStreamName)
    cy.get(selectors.dataStream.filterDomains).click()
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(3000)

    // Select 3 items using metaKey (command) and move to selected list
    cy.get(selectors.dataStream.optionsSources).eq(0).click({ metaKey: true })
    cy.get(selectors.dataStream.optionsSources).eq(2).click({ metaKey: true })
    cy.get(selectors.dataStream.optionsSources).eq(4).click({ metaKey: true })
    cy.get(selectors.dataStream.moveToTarget).click()

    // Validate 3 items were moved to the selected list
    cy.get(selectors.dataStream.optionsTarget).should('have.length', 3)

    // Filter selected items using search and validate only one item remains
    cy.get(selectors.dataStream.searchTarget).type('blue')
    cy.get(selectors.dataStream.optionsTarget).should('have.length', 1)

    // Select 3 more items and move them to the selected list
    cy.get(selectors.dataStream.optionsSources).eq(0).click({ metaKey: true })
    cy.get(selectors.dataStream.optionsSources).eq(1).click({ metaKey: true })
    cy.get(selectors.dataStream.optionsSources).eq(2).click({ metaKey: true })
    cy.get(selectors.dataStream.moveToTarget).click()

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000)

    // Intercept the second page of domain results
    cy.intercept('GET', '/api/v4/workspace/workloads?ordering=name&page=2&page_size=100&fields=id%2C+name&search=', {
      fixture: '/data-streaming/workloadsSecondPage.json'
    }).as('getDomainsSecond')

    // Clear search to show all selected items (expecting 6 total)
    cy.get(selectors.dataStream.searchTarget).clear()
    cy.get(selectors.dataStream.optionsTarget).should('have.length', 6)

    // Scroll to the bottom to trigger the next page of data
    cy.get(selectors.dataStream.optionsSources).last().scrollIntoView()
    cy.wait('@getDomainsSecond', { timeout: 30000 })
    cy.get(selectors.dataStream.optionsSources).should('have.length', 111)
    cy.get(selectors.dataStream.optionsSources).last().should('contain', 'delightful-asteroid')

    // Fill in HTTP connector configuration
    cy.get(selectors.dataStream.httpConnector.urlInput).type('https://hello.world')
    cy.get(selectors.dataStream.httpConnector.headersInput).type('header:value')

    // Assert and intercept the POST request on stream creation
    cy.intercept('POST', '/api/v3/data_streaming/streamings', (req) => {
      expect(req.body).to.have.property('all_domains')
      expect(req.body.domain_ids).to.be.an('array')
      expect(req.body.domain_ids).to.include.members([
        1742384127,
        1739880189,
        1729539972,
        1741002069,
        1713356473,
        1729539979
      ])

      req.reply({
        statusCode: 202,
        body: {}
      })
    }).as('dataStreams')

    // Submit the form and validate POST request
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.wait('@dataStreams', { timeout: 30000 })
  })
})
