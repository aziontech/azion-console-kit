import generateUniqueName from '../../../support/utils'
import selectors from '../../../support/selectors'

let fixtures = {}

describe('Edge Application', { tags: ['@dev4'] }, () => {
  beforeEach(() => {
    fixtures.edgeApplicationName = generateUniqueName('EdgeApp')
    fixtures.domainName = generateUniqueName('domain')
    fixtures.digitalCertificateName = generateUniqueName('CertificateName')

    // Login
    cy.login()

  })

  it('should add an chace settings', () => {
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

    cy.get(selectors.domains.nameInput).type(fixtures.domainName)

    // protocol section
    cy.get(selectors.domains.portHttp).click()
    cy.get(selectors.domains.dropdownSelectPort).find('li').eq(2).click()
    cy.get(selectors.domains.dropdownSelectPort).find('li').eq(3).click()
    cy.get(selectors.domains.portHttp).click()

    cy.get(selectors.domains.useHttpsField).click()
    cy.get(selectors.domains.portHttps).click()
    cy.get(selectors.domains.dropdownSelectPort).find('li').eq(2).click()
    cy.get(selectors.domains.dropdownSelectPort).find('li').eq(4).click()
    cy.get(selectors.domains.portHttps).click()
    cy.get(selectors.domains.tlsVersion).click()
    cy.get(selectors.domains.dropdownSelectTls).find('li').eq(2).click()
    cy.get(selectors.domains.cipherSuite).click()
    cy.get(selectors.domains.dropdownSelectCipher).find('li').eq(2).click()

    cy.intercept('GET', '/api/v4/edge_application/applications?ordering=name&page=1&page_size=100&fields=&search=').as('getEdgeApplicationList')
    cy.intercept('POST', '/api/v4/workspace/workloads').as('createDomain')

    cy.get(selectors.domains.cnameAccessOnlyField).click()
    
    
    // Act
    cy.get(selectors.form.createButtonAccordtion).eq(1).click()
    cy.wait('@createDomain')
    cy.verifyToast('success', 'Your domain has been created')
  })

  afterEach(() => {
    // Delete the edge application
    cy.deleteEntityFromList({
        entityName: fixtures.domainName,
        productName: 'Domains'
      }).then(() => {
        cy.verifyToast('Domain successfully deleted')
      })
    cy.deleteEntityFromList({
      entityName: fixtures.edgeApplicationName,
      productName: 'Edge Application'
    }).then(() => {
      cy.verifyToast('Resource successfully deleted')
    })
  })
})
