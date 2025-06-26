import selectors from '../../support/selectors'
import generateUniqueName from '../../support/utils'
import { payloadRequestWorkload } from '../../fixtures/workload.js'

let domainName
let edgeAppName
let firewallName
let domainEditedName
let digitalCertificateName

const createEdgeApplicationCase = () => {
  // Arrange
  edgeAppName = generateUniqueName('edgeApp')
  cy.openProduct('Edge Application')
  cy.get(selectors.edgeApplication.mainSettings.createButton).click()
  cy.get(selectors.edgeApplication.mainSettings.nameInput).type(edgeAppName)
  cy.intercept('POST', '/v4/edge_application/applications*').as('createEdgeApp')
  cy.get(selectors.form.actionsSubmitButton).click()
  cy.wait('@createEdgeApp')
  cy.verifyToast('success', 'Your edge application has been created')

  // Assert
  cy.get(selectors.domains.pageTitle(edgeAppName)).should('have.text', edgeAppName)
}

const createEdgeFirewallCase = () => {
  firewallName = generateUniqueName('edgeFirewall')
  cy.openProduct('Edge Firewall')
  cy.get(selectors.edgeFirewall.createButton).click()
  cy.get(selectors.edgeFirewall.nameInput).clear()
  cy.get(selectors.edgeFirewall.nameInput).type(firewallName)
  cy.get(selectors.edgeFirewall.edgeFunctionSwitch).click()
  cy.get(selectors.edgeFirewall.wafEnabledSwitch).click()
  cy.intercept('GET', '/v4/edge_firewall/firewalls/*').as('retrieveEdgeFirewall')
  cy.get(selectors.edgeFirewall.saveButton).click()
  cy.verifyToast('success', 'Your Edge Firewall has been created')
  cy.wait('@retrieveEdgeFirewall')
}

const createDigitalCertificate = () => {
  digitalCertificateName = generateUniqueName('digitalCertificate')

  cy.get(selectors.domains.digitalCertificatesDropdownLetsEncrypt).click()
  cy.get(selectors.domains.createDigitalCertificateButton).click()
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

  cy.intercept('GET', '/v4/digital_certificates/certificates/*?fields=*').as(
    'getDigitalCertificatesApi'
  )

  // Act
  cy.get(selectors.domains.digitalCertificateActionBar)
    .find(selectors.form.actionsSubmitButton)
    .click()

  // Assert
  cy.verifyToast('success', 'Your digital certificate has been created!')
  cy.wait('@getDigitalCertificatesApi')

  cy.get(selectors.domains.digitalCertificatesDropdownLetsEncrypt).should(
    'have.text',
    digitalCertificateName
  )
  cy.get(selectors.domains.digitalCertificatesDropdownLetsEncrypt).click()
  cy.get(selectors.domains.letsEncryptDropdownOption).click()
}

describe('Domains spec', { tags: ['@dev3'] }, () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/account/info', {
      fixture: '/account/info/without_flags.json'
    }).as('accountInfo')
    cy.login()
  })

  it('should edit a domain successfully', () => {
    createEdgeFirewallCase()
    createEdgeApplicationCase()
    domainName = generateUniqueName('domain')

    // Arrange
    cy.intercept('GET', '/api/v4/edge_firewall/firewalls*').as('getEdgeFirewalls')
    cy.openProduct('Domains')
    cy.intercept(
      'GET',
      '/api/v4/edge_application/applications?ordering=name&page=1&page_size=100&fields=&search='
    ).as('getEdgeApplicationList')
    cy.intercept(
      'GET',
      `/api/v4/edge_application/applications?ordering=name&page=1&page_size=100&fields=&search=${edgeAppName}`
    ).as('getEdgeApplicationListFilter')
    cy.get(selectors.workload.createButton).click()
    cy.get(selectors.workload.nameInput).type(domainName)

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

    cy.wait('@getEdgeApplicationList')

    cy.get(selectors.workload.edgeFirewallField).click()
    cy.get(selectors.workload.edgeFirewallDropdownSearch).clear()
    cy.intercept(
      'GET',
      `/v4/edge_firewall/firewalls?ordering=name&page=1&page_size=100&search=${firewallName}`
    ).as('getCreatedEdgeFirewall')
    cy.get(selectors.workload.edgeFirewallDropdownSearch).type(firewallName)
    cy.wait('@getCreatedEdgeFirewall')
    cy.get(selectors.workload.edgeFirewallOption).click()
    cy.get(selectors.workload.edgeApplicationField).click()
    cy.get(selectors.workload.edgeApplicationDropdownSearch).clear()
    cy.get(selectors.workload.edgeApplicationDropdownSearch).type(edgeAppName)

    cy.wait('@getEdgeApplicationListFilter')
    cy.get(selectors.workload.edgeApplicationOption).click()
    cy.get(selectors.workload.cnamesField).type(`${domainName}.net`)

    cy.intercept(
      { method: 'GET', url: '/api/v4/workspace/workloads/*' },
      { body: payloadRequestWorkload, statusCode: 200 }
    ).as('getWorkload')

    cy.intercept(
      { method: 'POST', url: '/api/v4/workspace/workloads' },
      { body: payloadRequestWorkload, statusCode: 202 }
    ).as('createWorkload')

    // Act
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert - create a domain
    cy.get(selectors.workload.dialogTitle).should('have.text', 'Workload has been created')
    cy.get(selectors.workload.domainField).should('be.visible')
    cy.get(selectors.workload.copyDomainButton).click()
    cy.verifyToast('Successfully copied!')
    cy.get(selectors.workload.confirmButton).click()
    cy.verifyToast(
      'Succesfully created!',
      'The domain is now available in the Workload management section.'
    )

    cy.wait('@getWorkload')

    domainEditedName = `${payloadRequestWorkload.data.name}-edit`

    // Act
    cy.get(selectors.workload.fieldTextInput).should('have.value', payloadRequestWorkload.data.name)
    cy.get(selectors.workload.fieldTextInput).clear()
    cy.get(selectors.workload.fieldTextInput).type(domainEditedName)
    cy.get(selectors.workload.cnamesField).clear()
    cy.get(selectors.workload.cnamesField).type(`${payloadRequestWorkload.data.name}-edit.net`)

    createDigitalCertificate()

    cy.get(selectors.workload.domainUri).should('be.disabled')
    cy.intercept(
      { method: 'PATCH', url: '/api/v4/workspace/workloads/*' },
      { body: payloadRequestWorkload, statusCode: 202 }
    ).as('editWorkload')

    cy.get(selectors.form.actionsSubmitButton).click()
    cy.wait('@editWorkload')

    // Assert
    cy.verifyToast('success', 'Your workload has been edited')
  })
})
