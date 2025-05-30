import selectors from '../../support/selectors'
import generateUniqueName from '../../support/utils'
import { payloadRequestWorkload } from '../../fixtures/workload.js'

let edgeAppName
let digitalCertificateName
let firewallName
const createEdgeApplicationCase = () => {
  edgeAppName = generateUniqueName('EdgeApp')
  firewallName = generateUniqueName('EdgeFirewall')
  // Arrange
  cy.get(selectors.edgeApplication.mainSettings.nameInput).type(edgeAppName)

  // Act
  cy.get(selectors.workload.edgeApplicationDrawer).find(selectors.form.actionsSubmitButton).click()

  // Assert
  cy.verifyToast('success', 'Your edge application has been created')
}

const createEdgeFirewallCase = () => {
  cy.get(selectors.edgeFirewall.nameInput).clear()
  cy.get(selectors.edgeFirewall.nameInput).type(firewallName)

  cy.get(selectors.workload.edgeFirewallActionBar).find(selectors.form.actionsSubmitButton).click()

  cy.verifyToast('success', 'Your Edge Firewall has been created')
}

const createDigitalCertificateCase = () => {
  digitalCertificateName = generateUniqueName('digitalCertificate')
  cy.get(selectors.digitalCertificates.digitalCertificateName).type(digitalCertificateName)
  cy.get(selectors.digitalCertificates.generateCSRRadioOption).click()
  cy.get(selectors.digitalCertificates.subjectNameInput).type(
    `${digitalCertificateName}.example.com`
  )
  cy.get(selectors.digitalCertificates.countryInput).type('BR')
  cy.get(selectors.digitalCertificates.stateInput).type('São Paulo')
  cy.get(selectors.digitalCertificates.cityInput).type('São Paulo')
  cy.get(selectors.digitalCertificates.organizationInput).type(`${digitalCertificateName} S.A.`)
  cy.get(selectors.digitalCertificates.organizationUnitInput).type('IT Department')
  cy.get(selectors.digitalCertificates.emailInput).clear()
  cy.get(selectors.digitalCertificates.emailInput).type(`${digitalCertificateName}@example.com`)
  cy.get(selectors.digitalCertificates.sanTextarea).type(`${digitalCertificateName}.net`)

  cy.intercept('GET', '/api/v4/digital_certificates/certificates/*?fields=*').as(
    'getDigitalCertificatesApi'
  )

  // Act
  cy.get(selectors.workload.digitalCertificateActionBar)
    .find(selectors.form.actionsSubmitButton)
    .click()

  // Assert
  cy.verifyToast('success', 'Your digital certificate has been created!')
  cy.wait('@getDigitalCertificatesApi')
}

describe('Workload spec', { tags: ['@dev3'] }, () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/account/info', {
      fixture: '/account/info/without_flags.json'
  }).as('accountInfo')
    cy.login()
  })

  it('should create and delete a domain using a edge application', () => {

    // Arrange
    cy.openProduct('Domains')
    cy.intercept(
      'GET',
      '/api/v4/edge_application/applications?ordering=name&page=1&page_size=100&fields=&search='
    ).as('getEdgeApplicationList')
    cy.intercept(
      'GET',
      `/api/v4/edge_firewall/firewalls?ordering=name&page=1&page_size=100&fields=&search=`
    ).as('getEdgeFirewallList')
    cy.intercept(
      'GET',
      '/api/v4/digital_certificates/certificates?ordering=name&page=1&page_size=100&fields=*&search=azion&type=*'
    ).as('searchDigitalCertificatesApi')

    cy.get(selectors.workload.createButton).click()
    cy.get(selectors.workload.nameInput).type('domain140525103151708')

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


    cy.get(selectors.workload.useHttp3Field).click()

    cy.wait('@getEdgeApplicationList')
    cy.get(selectors.workload.edgeApplicationField).click()
    cy.get(selectors.workload.createEdgeApplicationButton).click()
    createEdgeApplicationCase()

    cy.wait('@getEdgeFirewallList')
    cy.get(selectors.workload.edgeFirewallField).click()
    cy.get(selectors.workload.createEdgeFirewallButton).click()
    createEdgeFirewallCase()

    cy.get(selectors.workload.cnameAccessOnlyField).click()
    cy.get(selectors.workload.digitalCertificateDropdown).click()
    cy.get(selectors.workload.createDigitalCertificateButton).click()
    createDigitalCertificateCase()
    // Act

    cy.intercept(
      { method: 'POST', url: '/api/v4/workspace/workloads' },
      {
        statusCode: 400,
        body: 
          { certificate: ["Invalid certificate status, CANNOT use pending certificate."]  }
      }
    ).as('createWorkload');

    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('error', 'certificate: Invalid certificate status, CANNOT use pending certificate.')

    cy.get(selectors.workload.digitalCertificateDropdown).click()

    cy.get(selectors.workload.digitalCertificateDropdownFilterSearch).clear()
    cy.get(selectors.workload.digitalCertificateDropdownFilterSearch).type('azion')

    cy.wait('@searchDigitalCertificatesApi')
    cy.get(selectors.workload.edgeCertificateOption).click()

    cy.intercept(
      { method: 'POST', url: '/api/v4/workspace/workloads' },
      { body: payloadRequestWorkload, statusCode: 202 }
    ).as('createWorkload')

    cy.get(selectors.form.actionsSubmitButton).click()

    cy.wait('@createWorkload')

    // Assert
    cy.get(selectors.workload.dialogTitle).should('have.text', 'Workload has been created')
    cy.get(selectors.workload.domainField).should('be.visible')
    cy.get(selectors.workload.copyDomainButton).click()
    cy.verifyToast('Successfully copied!')
   
    cy.get(selectors.workload.confirmButton).click()
    cy.verifyToast(
      'Succesfully created!',
      'The domain is now available in the Workload management section.'
    )
  })
})
