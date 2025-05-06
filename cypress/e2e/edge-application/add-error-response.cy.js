import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let fixtures = {}


const createCacheSettings = () => {
  cy.get(selectors.edgeApplication.accordionStepCache.createCache).click()
  cy.get(selectors.edgeApplication.accordionStepCache.browserCacheSettings).click()
  cy.intercept('POST', 'api/v4/edge_application/applications/*/cache_settings').as('createCache')
  cy.get(selectors.form.createButtonAccordtion).eq(2).click()
  cy.wait('@createCache')
  cy.verifyToast('success', 'Cache Settings successfully created')
}

const createOrigin = () => {
  cy.get(selectors.edgeApplication.accordionStepOrigin.createOrigin).click()
  cy.get(selectors.edgeApplication.accordionStepOrigin.addressOriginInput).type(`${fixtures.edgeApplicationName}.app.azion`)
  cy.intercept('POST', 'api/v3/edge_applications/*/origins').as('createOrigin')
  cy.get(selectors.form.createButtonAccordtion).first().click()
  cy.wait('@createOrigin')
  cy.verifyToast('success', 'Your origin has been created')
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
  cy.intercept('POST', '/api/v4/workspace/workloads').as('createWorkload')

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
  createOrigin()
  createWorkload()
  createCacheSettings()

  cy.get(selectors.form.actionsFinishButton).click()
}

describe('Edge Application', { tags: ['@dev4'] }, () => {
  beforeEach(() => {
    fixtures.edgeApplicationName = generateUniqueName('EdgeApp')
    cy.intercept('GET', '/api/account/info', {
      fixture: '/account/info/without_flags.json'
    }).as('accountInfo')
    // Login
    cy.login()
    cy.intercept('GET', '/api/v3/edge_applications/*/origins*').as('getOriginsApi')

    fixtures = {
      functionName: generateUniqueName('EdgeFunction'),
      functionInstanceName: generateUniqueName('FunctionsInstance'),
      edgeApplicationName: generateUniqueName('EdgeApp'),
      originName: generateUniqueName('origin'),
      rulesEngineName: generateUniqueName('RulesEng'),
      cacheSettingName: generateUniqueName('cacheSetting'),
      domainName: generateUniqueName('domain')
    }
  })

  it('should add an error response', () => {
    //arrange
    cy.openProduct('Edge Application')
    createEdgeApplicationCase()
    cy.get(selectors.edgeApplication.tabs('Error Responses')).click()

    //act
    //add error response 1
    cy.get(selectors.edgeApplication.errorResponses.createButton).click()
    cy.get(selectors.edgeApplication.errorResponses.statusCodes(1)).click()
    cy.get(selectors.edgeApplication.errorResponses.statusCodes(1)).find('li').eq(0).click()
    cy.get(selectors.edgeApplication.errorResponses.paths(1)).type('/test/')
    cy.get(selectors.edgeApplication.errorResponses.customStatus(1)).type('200')

    //add error response 2
    cy.get(selectors.edgeApplication.errorResponses.createButton).click()
    cy.get(selectors.edgeApplication.errorResponses.statusCodes(2)).click()
    cy.get(selectors.edgeApplication.errorResponses.statusCodes(2)).find('li').eq(1).click()
    cy.get(selectors.edgeApplication.errorResponses.paths(2)).type('/test/test2')
    cy.get(selectors.edgeApplication.errorResponses.customStatus(2)).type('200')

    //select origin
    cy.get(selectors.edgeApplication.errorResponses.origin).click()
    cy.wait('@getOriginsApi')
    cy.get(selectors.edgeApplication.errorResponses.origin).find('li').eq(0).click()

    //assert
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your Error Responses has been edited')
    cy.get(selectors.form.actionsCancelButton).click()
  })
})
