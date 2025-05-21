import generateUniqueName from '../../../support/utils'
import selectors from '../../../support/selectors'
import { payloadRequestWorkload } from '../../../fixtures/workload.js'

let fixtures = {}

describe('Edge Application', { tags: ['@dev4'] }, () => {
  beforeEach(() => {
    fixtures.edgeApplicationName = generateUniqueName('EdgeApp')
    fixtures.domainName = generateUniqueName('domain')
    fixtures.digitalCertificateName = generateUniqueName('CertificateName')
    cy.intercept('GET', '/api/account/info', {
      fixture: '/account/info/without_flags.json'
    }).as('accountInfo')
    // Login
    cy.login()

  })

  it('should add an workload', () => {
    //edge application creation
    cy.openProduct('Edge Application')
    
    cy.get(selectors.edgeApplication.mainSettings.createButton).click()
    cy.get(selectors.edgeApplication.mainSettings.nameInput).type(fixtures.edgeApplicationName)
    cy.intercept('POST', 'api/v4/edge_application/applications*').as('createEdgeApp')
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.wait('@createEdgeApp')
    cy.verifyToast('success', 'Your edge application has been created')
    
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

    cy.get(selectors.workload.customHostname).type('testcustom')
    cy.get(selectors.workload.cnamesField).type('www.test.net')
    cy.get(selectors.workload.workloadAllowAccess).click()

    cy.intercept('GET', '/api/v4/edge_application/applications?ordering=name&page=1&page_size=100&fields=&search=').as('getEdgeApplicationList')
    cy.intercept(
      { method: 'POST', url: '/api/v4/workspace/workloads' },
      { body: payloadRequestWorkload, statusCode: 202 }
    ).as('createWorkload')
        
    // Act
    cy.get(selectors.form.createButtonAccordtion).eq(1).click()
    cy.wait('@createWorkload')
    cy.verifyToast('success', 'Your workload has been created')
  })
})
