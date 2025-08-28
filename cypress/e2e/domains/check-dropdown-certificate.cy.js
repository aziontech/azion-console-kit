import selectors from '../../support/selectors'
import generateUniqueName from '../../support/utils'

const digitalCertificateName = generateUniqueName('CertificateName')

describe('Domains - Certificate Dropdown', { tags: ['@dev8', '@dont_run_prod'] }, () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/account/info', {
      fixture: '/account/info/domain_flags.json'
    }).as('accountInfo')
    
    cy.login()
    cy.openProduct('Domains')
  })

  it('should verify certificate dropdown functionality', () => {
    // Arrange
    const endpoints = {
      edgeApplications: '/api/v4/edge_application/applications?ordering=name&page=1&page_size=100&fields=&search=',
      edgeFirewalls: '/api/v4/edge_firewall/firewalls?ordering=name&page=1&page_size=100&fields=&search=',
      digitalCertificates: {
        list: '/v4/digital_certificates/certificates?ordering=name&page=*&page_size=100&type=edge_certificate&fields=id%2Cname',
        search: '/v4/digital_certificates/certificates?ordering=name&page=1&page_size=100&fields=*&search=azion&type=*',
        create: '/v4/digital_certificates/certificates*'
      }
    }

    // Intercept API calls
    cy.intercept('GET', endpoints.edgeApplications).as('getEdgeApplications')
    cy.intercept('GET', endpoints.edgeFirewalls).as('getEdgeFirewalls')
    cy.intercept('GET', endpoints.digitalCertificates.list).as('getDigitalCertificates')
    cy.intercept('GET', endpoints.digitalCertificates.search).as('searchDigitalCertificates')
    cy.intercept('POST', endpoints.digitalCertificates.create).as('createDigitalCertificate')

    // Test default certificate
    cy.get(selectors.domains.createButton).click()
    cy.wait('@getDigitalCertificates')
    
    cy.get(selectors.domains.digitalCertificateDropdownOpen)
      .find('.p-dropdown-label')
      .invoke('text')
      .should('include', 'Azion (SAN)')

    // Open dropdown and verify items
    cy.get(selectors.domains.digitalCertificateDropdownOpen).click()
    cy.get(selectors.domains.digitalCertificateDropdownList)
      .should('have.length.gt', 0)
      .then(($items) => {
        cy.log(`Found ${$items.length} certificate(s) in dropdown`)
      })

    // Create new certificate
    cy.get(selectors.digitalCertificates.createDigitalCertificateButton)
      .should('be.visible')
      .click()

    // Fill and submit certificate form
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.get(selectors.digitalCertificates.digitalCertificateName)
      .clear()
      .type(digitalCertificateName)
      
    cy.get('[data-testid="digital-certificates-drawer__action-bar"] [data-testid="form-actions-submit-button"]')
      .click()

    // Verify new certificate is selected
    cy.wait('@createDigitalCertificate')
    cy.get(selectors.domains.digitalCertificateDropdownOpen)
      .find('.p-dropdown-label')
      .invoke('text')
      .should('include', digitalCertificateName)
  })
})