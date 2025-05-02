import selectors from '../../support/selectors'
import generateUniqueName from '../../support/utils'

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
  cy.intercept('POST', 'api/v4/edge_application/applications*').as('createEdgeApp')
  cy.get(selectors.form.actionsSubmitButton).click()
  cy.wait('@createEdgeApp')
  cy.verifyToast('success', 'Your edge application has been created')
  cy.get(selectors.form.actionsSkipButton).click()
  cy.get(selectors.edgeApplication.mainSettings.unsaved).click()

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
  cy.intercept('GET', '/api/v4/edge_firewall/firewalls/*').as('retrieveEdgeFirewall')
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

  cy.intercept('GET', '/api/v4/digital_certificates/certificates/*?fields=*').as(
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
    cy.get(selectors.domains.createButton).click()
    cy.get(selectors.domains.nameInput).type(domainName)

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

    cy.wait('@getEdgeFirewalls')
    cy.wait('@getEdgeApplicationList')

    cy.get(selectors.domains.edgeFirewallField).click()
    cy.get(selectors.domains.edgeFirewallDropdownSearch).clear()
    cy.intercept(
      'GET',
      `/api/v4/edge_firewall/firewalls?ordering=name&page=1&page_size=100&fields=&search=${firewallName}`
    ).as('getCreatedEdgeFirewall')
    cy.get(selectors.domains.edgeFirewallDropdownSearch).type(firewallName)
    cy.wait('@getCreatedEdgeFirewall')
    cy.get(selectors.domains.edgeFirewallOption).click()
    cy.get(selectors.domains.edgeApplicationField).click()
    cy.get(selectors.domains.edgeApplicationDropdownSearch).clear()
    cy.get(selectors.domains.edgeApplicationDropdownSearch).type(edgeAppName)

    cy.wait('@getEdgeApplicationListFilter')
    cy.get(selectors.domains.edgeApplicationOption).click()
    cy.get(selectors.domains.cnamesField).type(`${domainName}.net`)

    // Act
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert - create a domain
    cy.get(selectors.domains.dialogTitle).should('have.text', 'Workload has been created')
    cy.get(selectors.domains.domainField).should('be.visible')
    cy.get(selectors.domains.copyDomainButton).click()
    cy.verifyToast('Successfully copied!')
    cy.get(selectors.domains.confirmButton).click()
    cy.verifyToast(
      'Succesfully created!',
      'The domain is now available in the Workload management section.'
    )

    domainEditedName = `${domainName}-edit`

    // Act
    cy.get(selectors.domains.fieldTextInput).should('have.value', domainName)
    cy.get(selectors.domains.fieldTextInput).clear()
    cy.get(selectors.domains.fieldTextInput).type(domainEditedName)
    cy.get(selectors.domains.cnamesField).clear()
    cy.get(selectors.domains.cnamesField).type(`${domainName}-edit.net`)

    createDigitalCertificate()

    cy.get(selectors.domains.domainUri).should('be.disabled')
    cy.intercept('PATCH', '/api/v4/workspace/workloads/*').as('editWorkload')

    cy.get(selectors.form.actionsSubmitButton).click()
    cy.wait('@editWorkload')

    // Assert
    cy.verifyToast('success', 'Your workload has been edited')
    cy.get(selectors.domains.dataTableSearchInput).clear()
    cy.get(selectors.domains.dataTableSearchInput).type(`${domainEditedName}{enter}`)
    cy.get(selectors.domains.listTableBlockColumnNameRow).should('have.text', domainEditedName)
  })
})
