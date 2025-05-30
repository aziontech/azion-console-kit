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
  cy.get(selectors.edgeApplication.mainSettings.addressInput).type(`${edgeAppName}.edge.app`)

  // Act
  cy.get(selectors.form.actionsSubmitButton).click()

  // Assert
  cy.verifyToast('success', 'Your edge application has been created')
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
    cy.intercept('GET', '/api/account/info', {
        fixture: '/account/info/domain_flags.json'
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
      '/v4/edge_application/applications?ordering=name&page=1&page_size=100&fields=&search='
    ).as('getEdgeApplicationList')
    cy.intercept(
      'GET',
      `/v4/edge_application/applications?ordering=name&page=1&page_size=100&fields=&search=${edgeAppName}`
    ).as('getEdgeApplicationListFilter')
    cy.get(selectors.domains.createButton).click()
    cy.get(selectors.domains.nameInput).type(domainName)
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
    cy.get(selectors.domains.dialogTitle).should('have.text', 'Domain has been created')
    cy.get(selectors.domains.domainField).should('be.visible')
    cy.get(selectors.domains.copyDomainButton).click()
    cy.verifyToast('Successfully copied!')
    cy.get(selectors.domains.confirmButton).click()
    cy.verifyToast(
      'Succesfully created!',
      'The domain is now available in the Domain management section.'
    )

    domainEditedName = `${domainName}-edit`

    // Act
    cy.get(selectors.domains.fieldTextInput).should('have.value', domainName)
    cy.get(selectors.domains.fieldTextInput).clear()
    cy.get(selectors.domains.edgeFirewallClearIcon).click()
    cy.get(selectors.domains.fieldTextInput).type(domainEditedName)
    cy.get(selectors.domains.cnamesField).clear()
    cy.get(selectors.domains.cnamesField).type(`${domainName}-edit.net`)

    createDigitalCertificate()

    cy.get(selectors.domains.domainUri).should('be.disabled')
    cy.get(selectors.domains.editFormCopyDomainButton).should('be.visible')
    cy.get(selectors.domains.activeSwitchEditForm).click()
    cy.intercept('PATCH', '/api/v3/domains/*', (req) => {
      expect(req.body).to.have.property('edge_firewall_id', null)
    }).as('editDomain')
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.wait('@editDomain')

    // Assert
    cy.verifyToast('success', 'Your domain has been edited')
    cy.get(selectors.domains.dataTableSearchInput).clear()
    cy.get(selectors.domains.dataTableSearchInput).type(`${domainEditedName}{enter}`)
    cy.get(selectors.domains.listTableBlockColumnNameRow).should('have.text', domainEditedName)
    cy.get(selectors.domains.listTableBlockColumnActiveRow).should('have.text', 'Inactive')
  })

  it('should edit a domain with invalid cname', () => {
    const cnames = generateUniqueName('cnames-domains')
    createEdgeApplicationCase()
    domainName = generateUniqueName('domain')

    // Arrange
    cy.openProduct('Domains')
    cy.intercept(
      'GET',
      '/v4/edge_application/applications?ordering=name&page=1&page_size=100&fields=&search='
    ).as('getEdgeApplicationList')
    cy.intercept(
      'GET',
      `/v4/edge_application/applications?ordering=name&page=1&page_size=100&fields=&search=${edgeAppName}`
    ).as('getEdgeApplicationListFilter')
    cy.get(selectors.domains.createButton).click()
    cy.get(selectors.domains.nameInput).type(domainName)
    cy.wait('@getEdgeApplicationList')

    cy.get(selectors.domains.edgeApplicationField).click()
    cy.get(selectors.domains.edgeApplicationDropdownSearch).clear()
    cy.get(selectors.domains.edgeApplicationDropdownSearch).type(edgeAppName)

    cy.wait('@getEdgeApplicationListFilter')
    cy.get(selectors.domains.edgeApplicationOption).click()
    cy.get(selectors.domains.cnamesField).type(`${cnames}.com.br`)

    // Act
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert - create a domain
    cy.get(selectors.domains.dialogTitle).should('have.text', 'Domain has been created')
    cy.get(selectors.domains.domainField).should('be.visible')
    cy.get(selectors.domains.copyDomainButton).click()
    cy.verifyToast('Successfully copied!')
    cy.get(selectors.domains.confirmButton).click()
    cy.verifyToast(
      'Succesfully created!',
      'The domain is now available in the Domain management section.'
    )

    domainEditedName = `${domainName}-edit`

    // Act
    cy.get(selectors.domains.fieldTextInput).should('have.value', domainName)
    cy.get(selectors.domains.fieldTextInput).clear()
    cy.get(selectors.domains.fieldTextInput).type(domainEditedName)
    cy.get(selectors.domains.cnamesField).clear()
    cy.get(selectors.domains.cnamesField).type(`**${cnames}-edit.com.br`)

    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.verifyToast('error', `cname_invalid_format: **${cnames}-edit.com.br`)
  })
})
