import generateUniqueName from '../../../support/utils'
import selectors from '../../../support/selectors'
import { payloadRequestWorkload } from '../../../fixtures/workload.js'
import { httpResponse } from '../../../fixtures/edge-connectors/create-edge-connectors.js'

let fixtures = {}

const createCacheSettings = () => {
  cy.get(selectors.edgeApplication.accordionStepCache.createCache).click()
  cy.get(selectors.edgeApplication.accordionStepCache.browserCacheSettings).click()
  cy.intercept('POST', '/v4/edge_application/applications/*/cache_settings').as('createCache')
  cy.get(selectors.form.createButtonAccordtion).eq(2).click()
  cy.wait('@createCache')
  cy.verifyToast('success', 'Cache Settings successfully created')
}

const createEdgeConnector = () => {
  cy.get(selectors.edgeApplication.accordionStepEdgeConnector.createEdgeConnector).click()
  cy.get(selectors.edgeConnector.name).clear()
  cy.get(selectors.edgeConnector.name).type(fixtures.edgeConnectorName)
  cy.get(selectors.edgeConnector.http.host).clear()
  cy.get(selectors.edgeConnector.http.host).type('www.google.com')
  cy.get(selectors.edgeConnector.http.path).clear()
  cy.get(selectors.edgeConnector.http.path).type('/')
  cy.get(selectors.edgeConnector.http.realIpHeader).clear()
  cy.get(selectors.edgeConnector.http.realIpHeader).type('192.168.60.98')
  cy.get(selectors.edgeConnector.http.realPortHeader).clear()
  cy.get(selectors.edgeConnector.http.realPortHeader).type('1989')
  cy.get(selectors.edgeConnector.address).clear()
  cy.get(selectors.edgeConnector.address).type('www.google.com')
  cy.intercept(
    { method: 'POST', url: '/api/v4/edge_connector/connectors' },
    { body: httpResponse, statusCode: 202 }
  ).as('createEdgeConnector')
  cy.get(selectors.form.createButtonAccordtion).first().click()
  cy.wait('@createEdgeConnector')
  cy.verifyToast('success', 'Edge Connector successfully created')
}

const createWorkload = () => {
  cy.intercept('GET', `/api/v4/edge_firewall/firewalls?ordering=name&page=1&page_size=100&fields=&search=`).as('getEdgeFirewallList')
  cy.intercept('GET', '/api/v4/digital_certificates/certificates?ordering=name&page=1&page_size=100&fields=*&search=azion&type=*').as('searchDigitalCertificatesApi')
  cy.get(selectors.edgeApplication.accordionStepDomain.createDomain).click()

  // create domain

  cy.get(selectors.workload.nameInput).type(fixtures.domainName)

  // protocol section
  cy.get(selectors.workload.portHttp).click()
  cy.get(selectors.workload.dropdownSelectPort).find('li').eq(2).click()
  cy.get(selectors.workload.dropdownSelectPort).find('li').eq(3).click()
  cy.get(selectors.workload.portHttp).click()

  cy.get(selectors.workload.useHttpsField).click()
  cy.get(selectors.workload.portHttps).click()
  cy.get(selectors.workload.dropdownSelectPort).find('li').eq(2).click()
  cy.get(selectors.workload.dropdownSelectPort).find('li').eq(4).click()
  cy.get(selectors.workload.portHttps).click()
  cy.get(selectors.workload.tlsVersion).click()
  cy.get(selectors.workload.dropdownSelectTls).find('li').eq(2).click()
  cy.get(selectors.workload.cipherSuite).click()
  cy.get(selectors.workload.dropdownSelectCipher).find('li').eq(2).click()

  cy.intercept('GET', '/api/v4/edge_application/applications?ordering=name&page=1&page_size=100&fields=&search=').as('getEdgeApplicationList')
  cy.intercept(
    { method: 'POST', url: '/api/v4/workspace/workloads' },
    { body: payloadRequestWorkload, statusCode: 202 }
  ).as('createWorkload')

  cy.get(selectors.workload.cnameAccessOnlyField).click()


  // Act
  cy.get(selectors.form.createButtonAccordtion).eq(1).click()
  cy.wait('@createWorkload')
  cy.verifyToast('success', 'Your workload has been created')
}
/**
 * Creates a new edge application with basic settings.
 */
const createEdgeApplicationCase = () => {
  // Act
  cy.get(selectors.edgeApplication.mainSettings.createButton).click()
  cy.get(selectors.edgeApplication.mainSettings.nameInput).type(fixtures.edgeApplicationName)
  cy.intercept('POST', 'api/v4/edge_application/applications*').as('createEdgeApp')
  cy.get(selectors.form.actionsSubmitButton).click()
  cy.wait('@createEdgeApp')
  cy.verifyToast('success', 'Your edge application has been created')
  createEdgeConnector()
  createWorkload()
  createCacheSettings()

  cy.intercept(
    { method: 'PATCH', url: '/api/v4/edge_application/applications/*/rules/*' },
    { body: {}, statusCode: 202 }
  )

  cy.get(selectors.form.actionsFinishButton).click()
  cy.get(selectors.form.actionsCancelButton).click()

  // Assert - Verify the edge application was created
  cy.get(selectors.list.searchInput).type(`${fixtures.edgeApplicationName}{enter}`)
  cy.get(selectors.list.filteredRow.column('name')).should(
    'have.text',
    fixtures.edgeApplicationName
  )

  // Act - Navigate to the created edge application
  cy.get(selectors.list.filteredRow.column('name')).click()
}

describe('Edge Application', { tags: ['@dev4'] }, () => {
  beforeEach(() => {
    fixtures.edgeApplicationName = generateUniqueName('EdgeApp')
    cy.intercept('GET', '/api/account/info', {
      fixture: '/account/info/without_flags.json'
    }).as('accountInfo')
    // Login
    cy.login()

    fixtures = {
      functionName: generateUniqueName('EdgeFunction'),
      functionInstanceName: generateUniqueName('FunctionsInstance'),
      edgeApplicationName: generateUniqueName('EdgeApp'),
      originName: generateUniqueName('origin'),
      rulesEngineName: generateUniqueName('RulesEng'),
      cacheSettingName: generateUniqueName('cacheSetting'),
      domainName: generateUniqueName('domain'),
      edgeConnectorName: generateUniqueName('EdgeConnector')
    }
  })

  it('should create a rule engine set cache policy', () => {
    // Arrange
    cy.openProduct('Edge Application')
    createEdgeApplicationCase()
    cy.get(selectors.edgeApplication.tabs('Rules Engine')).click()

    // Act
    // Create a rule
    cy.get(selectors.edgeApplication.rulesEngine.createButton).click()
    cy.get(selectors.edgeApplication.rulesEngine.ruleNameInput).type(fixtures.rulesEngineName)
    cy.get(selectors.edgeApplication.rulesEngine.criteriaOperatorDropdown(0, 0)).click()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaOperatorOption('is equal')).click()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaInputValue(0, 0)).clear()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaInputValue(0, 0)).type('/')
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsDropdown(0)).click()
    cy.get(selectors.edgeApplication.rulesEngine.behaviorsOption('Set Cache Policy')).click()
    cy.get(selectors.edgeApplication.rulesEngine.setCachePolicySelect(0)).click()
    cy.get(selectors.edgeApplication.rulesEngine.setCachePolicySelect(0))
      .find(selectors.edgeApplication.rulesEngine.cachePolicyOption('Default Cache Settings'))
      .click()

    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Rule successfully created')

    // Assert
    cy.get(selectors.list.searchInput).type(`${fixtures.rulesEngineName}{enter}`)
    cy.get(selectors.list.filteredRow.column('name')).should('have.text', fixtures.rulesEngineName)
  })
})
