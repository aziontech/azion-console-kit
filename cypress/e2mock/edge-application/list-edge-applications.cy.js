import selectors from '../../support/selectors'

describe('Edge Application List Spec', { tags: ['@dev2'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.intercept('GET', '/api/v4/edge_application/*', {
      fixture: '/edge-application/edge-applications.json'
    }).as('edgeApplicationsListApi')

    cy.openProduct('Edge Application')

    cy.wait('@edgeApplicationsListApi', { timeout: 30000 })
  })

  it('Should filter the list of edge applications.', function () {
    cy.intercept('GET', '/api/v4/edge_application/*', (req) => {
      if (req.url.includes('search=foo+1')) {
        req.reply({
          fixture: '/edge-application/edge-applications-filtered.json'
        })
      }
    }).as('filteredEdgeApplicationsListApi')

    cy.get(selectors.list.searchInput).clear()
    cy.get(selectors.list.searchInput).type('foo 1{enter}')

    cy.wait('@filteredEdgeApplicationsListApi')
      .its('response.body')
      .should('have.property', 'count', 1)
    cy.get(selectors.list.filteredRow.column('name')).should('have.text', 'foo 1')
  })

  it('Should display empty state when filters result in no data', function () {
    cy.intercept('GET', '/api/v4/edge_application/*', (req) => {
      if (req.url.includes('search=no+data')) {
        req.reply({
          count: 0,
          results: []
        })
      }
    }).as('filteredEdgeApplicationsListApi')

    cy.get(selectors.list.searchInput).clear()
    cy.get(selectors.list.searchInput).type('no data{enter}')

    cy.wait('@filteredEdgeApplicationsListApi')
      .its('response.body')
      .should('have.property', 'count', 0)
    cy.get(selectors.list.filteredRow.empty).should('have.text', 'No edge applications found.')
  })

  it('should ordering edge applications list', function () {
    cy.intercept('GET', '/api/v4/edge_application/*', (req) => {
      if (req.url.includes('ordering=name')) {
        req.reply({
          fixture: '/edge-application/edge-applications-ordering-name.json'
        })
      }
    }).as('filteredEdgeApplicationsListApi')

    cy.get(selectors.list.orderingHeader.firstColumn).click()

    cy.wait('@filteredEdgeApplicationsListApi').then((interception) => {
      expect(interception.response.body.results[0].name).to.eq('foo 4')
    })
  })

  it('should change page size of edge applications list', function () {
    cy.intercept('GET', '/api/v4/edge_application/*', (req) => {
      if (req.url.includes('page_size=100')) {
        req.reply({
          fixture: '/edge-application/edge-applications-page-size-100.json'
        })
      }
    }).as('filteredEdgeApplicationsListApi')

    cy.get(selectors.list.rowsPerPage.dropdown).click()
    cy.get(selectors.list.rowsPerPage.option('100')).click()

    cy.wait('@filteredEdgeApplicationsListApi')
      .its('response.body')
      .should('have.property', 'count', 100)
  })
})
