import selectors from '../../support/selectors'
describe('Edge Application Tabs Visibility - Mock Test', { tags: ['@dev2'] }, () => {
  context('When api v4 is enabled', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/account/info', {
        fixture: '/account/info/workload_flags.json'
      }).as('accountInfo')

      cy.login()
      cy.wait('@accountInfo', { timeout: 30000 })

      cy.intercept('GET', '/v4/edge_application/applications*', {
        fixture: '/edge-application/edge-applications.json'
      }).as('edgeApplicationsListApi')

      cy.openProduct('Edge Application')

      cy.wait('@edgeApplicationsListApi', { timeout: 30000 })

      cy.get('[data-testid="edge-applications-list-table-block"] [data-pc-section="bodyrow"]')
        .first()
        .click()

      cy.intercept('GET', '/v4/edge_application/applications/*', {
        fixture: '/edge-application/edge-application-item-v4.json'
      }).as('edgeApplicationItemApi')

      cy.wait('@edgeApplicationItemApi', { timeout: 30000 })
    })

    it('it should not show origins and error responses tabs', () => {
      cy.get(selectors.edgeApplication.tabs('Main Settings')).should('be.visible')
      cy.get(selectors.edgeApplication.tabs('Origins')).should('not.exist')
      cy.get(selectors.edgeApplication.tabs('Device Groups')).should('be.visible')
      cy.get(selectors.edgeApplication.tabs('Error Responses')).should('not.exist')
      cy.get(selectors.edgeApplication.tabs('Cache Settings')).should('be.visible')
      cy.get(selectors.edgeApplication.tabs('Functions Instances')).should('be.visible')
      cy.get(selectors.edgeApplication.tabs('Rules Engine')).should('be.visible')
    })

    it('should navigate between tabs correctly', () => {
      const tabs = {
        'Main Settings': 'main-settings',
        'Device Groups': 'device-groups',
        'Cache Settings': 'cache-settings',
        'Functions Instances': 'functions',
        'Rules Engine': 'rules-engine'
      }

      Object.entries(tabs).forEach(([tabName, tabUrl]) => {
        cy.get(selectors.edgeApplication.tabs(tabName)).click()
        cy.url().should('include', `/${tabUrl}`)
      })
    })
  })

  context('When api v4 is disabled', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/account/info', {
        fixture: '/account/info/domain_flags.json'
      }).as('accountInfo')

      cy.login()
      cy.wait('@accountInfo', { timeout: 30000 })

      cy.intercept('GET', '/v4/edge_application/applications*', {
        fixture: '/edge-application/edge-applications.json'
      }).as('edgeApplicationsListApi')

      cy.openProduct('Edge Application')
      cy.wait('@edgeApplicationsListApi', { timeout: 30000 })

      cy.get('[data-testid="edge-applications-list-table-block"] [data-pc-section="bodyrow"]')
        .first()
        .click()

      cy.intercept('GET', '/api/v3/edge_applications/*', {
        fixture: '/edge-application/edge-application-item-v3.json'
      }).as('edgeApplicationItemApi')

      cy.wait('@edgeApplicationItemApi', { timeout: 30000 })
    })

    it('should not show origins and error responses tabs', () => {
      cy.get(selectors.edgeApplication.tabs('Main Settings')).should('be.visible')
      cy.get(selectors.edgeApplication.tabs('Origins')).should('be.visible')
      cy.get(selectors.edgeApplication.tabs('Device Groups')).should('be.visible')
      cy.get(selectors.edgeApplication.tabs('Error Responses')).should('be.visible')
      cy.get(selectors.edgeApplication.tabs('Cache Settings')).should('be.visible')
      cy.get(selectors.edgeApplication.tabs('Functions Instances')).should('be.visible')
      cy.get(selectors.edgeApplication.tabs('Rules Engine')).should('be.visible')
    })

    it('should navigate between tabs correctly', () => {
      const tabs = {
        'Main Settings': 'main-settings',
        Origins: 'origins',
        'Device Groups': 'device-groups',
        'Error Responses': 'error-responses',
        'Cache Settings': 'cache-settings',
        'Functions Instances': 'functions',
        'Rules Engine': 'rules-engine'
      }

      Object.entries(tabs).forEach(([tabName, tabUrl]) => {
        cy.get(selectors.edgeApplication.tabs(tabName)).click()
        cy.url().should('include', `/${tabUrl}`)
      })
    })
  })
})
