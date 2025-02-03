import generateUniqueName from '../../../support/utils'
import selectors from '../../../support/selectors'

let fixtures = {
    cacheName: 'Default Cache Settings',
    originName: 'Default Origin'
}


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

const createDomain = () => {
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
}

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

    createOrigin()
    createDomain()
    createCacheSettings()
    
    cy.get(selectors.form.actionsFinishButton).click()
    // cache settings
    cy.get(selectors.edgeApplication.tabs('Cache Settings')).click()

    //Assert
    cy.get(selectors.list.searchInput).type(`${fixtures.cacheName}{enter}`)
    cy.get(selectors.list.filteredRow.column('name')).should('have.text', fixtures.cacheName)

    // origin
    cy.get(selectors.edgeApplication.tabs('Origins')).click()

    //Assert
    cy.get(selectors.list.searchInput).type(`${fixtures.originName}{enter}`)
    cy.get(selectors.list.filteredRow.column('name')).should('have.text', fixtures.originName)
  })

  afterEach(() => {
    // Delete the edge application
    cy.deleteEntityFromList({
        entityName: fixtures.domainName,
        productName: 'Domains'
      }).then(() => {
        cy.verifyToast('Resource successfully deleted')
      })
    cy.deleteEntityFromList({
      entityName: fixtures.edgeApplicationName,
      productName: 'Edge Application'
    }).then(() => {
      cy.verifyToast('Resource successfully deleted')
    })
  })
})
