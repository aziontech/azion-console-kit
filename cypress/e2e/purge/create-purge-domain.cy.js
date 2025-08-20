import selectors from '../../support/selectors'
import generateUniqueName from '../../support/utils'

let domainName
let edgeAppName
let generatedDomainUrl
let digitalCertificateName
let firewallName

const createEdgeApplicationCase = () => {
  edgeAppName = generateUniqueName('EdgeApp')
  firewallName = generateUniqueName('EdgeFirewall')
  // Arrange
  cy.get(selectors.edgeApplication.mainSettings.nameInput).type(edgeAppName)
  cy.get(selectors.edgeApplication.mainSettings.addressInput).type(`${edgeAppName}.edge.app`)

  // Act
  cy.get(selectors.domains.edgeApplicationDrawer).find(selectors.form.actionsSubmitButton).click()

  // Assert
  cy.verifyToast('success', 'Your edge application has been created')
}

const createEdgeFirewallCase = () => {
  cy.get(selectors.edgeFirewall.nameInput).clear()
  cy.get(selectors.edgeFirewall.nameInput).type(firewallName)

  cy.get(selectors.domains.edgeFirewallActionBar).find(selectors.form.actionsSubmitButton).click()

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

  cy.intercept('GET', '/v4/digital_certificates/certificates/*?').as('getDigitalCertificatesApi')

  // Act
  cy.get(selectors.domains.digitalCertificateActionBar)
    .find(selectors.form.actionsSubmitButton)
    .click()

  // Assert
  cy.verifyToast('success', 'Your digital certificate has been created!')
  cy.wait('@getDigitalCertificatesApi')
}

describe('Real-time Purge spec', { tags: ['@dev6'] }, () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/account/info', {
      fixture: '/account/info/domain_flags.json'
    }).as('accountInfo')
    cy.login()
  })

  it('should create a Real-Time Purge using a domain', () => {
    // Arrange
    domainName = generateUniqueName('domain')
    edgeAppName = generateUniqueName('edgeApp')
    cy.openProduct('Edge Application')
    cy.get(selectors.edgeApplication.mainSettings.createButton).click()
    cy.get(selectors.edgeApplication.mainSettings.nameInput).type(edgeAppName)
    cy.get(selectors.edgeApplication.mainSettings.addressInput).clear()
    cy.get(selectors.edgeApplication.mainSettings.addressInput).type('httpbingo.org')
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your edge application has been created')

    // Arrange
    cy.openProduct('Domains')
    cy.intercept(
      'GET',
      '/api/v4/workspace/applications?ordering=name&page=1&page_size=100&fields=&search='
    ).as('getEdgeApplicationList')

    cy.intercept(
      'GET',
      `/v4/workspace/firewalls?ordering=name&page=1&page_size=100&fields=&search=`
    ).as('getEdgeFirewallList')

    cy.intercept(
      'GET',
      ' /v4/digital_certificates/certificates?ordering=name&page=1&page_size=100&fields=*&search=azion&type=*'
    ).as('searchDigitalCertificatesApi')

    cy.get(selectors.domains.createButton).click()
    cy.get(selectors.domains.nameInput).type(domainName)

    cy.wait('@getEdgeApplicationList')
    cy.get(selectors.domains.edgeApplicationField).click()
    cy.get(selectors.domains.createEdgeApplicationButton).click()
    createEdgeApplicationCase()

    // cy.wait('@getEdgeFirewallList')
    cy.get(selectors.domains.edgeFirewallField).click()
    cy.get(selectors.domains.createEdgeFirewallButton).click()
    createEdgeFirewallCase()

    cy.get(selectors.domains.cnameAccessOnlyField).click()
    cy.get(selectors.domains.digitalCertificateDropdown).click()
    cy.get(selectors.domains.createDigitalCertificateButton).click()
    createDigitalCertificateCase()

    // Act
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('error', 'digital_certificate_id: cannot set a pending certificate to a domain')

    cy.get(selectors.domains.digitalCertificateDropdown).click()

    cy.get(selectors.domains.digitalCertificateDropdownFilterSearch).clear()
    cy.get(selectors.domains.digitalCertificateDropdownFilterSearch).type('azion')

    cy.wait('@searchDigitalCertificatesApi')
    cy.get(selectors.domains.edgeCertificateOption).click()
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert - create a domain
    cy.get(selectors.domains.dialogTitle).should('have.text', 'Domain has been created')
    cy.get(selectors.domains.domainField)
      .then(($el) => {
        generatedDomainUrl = $el.val()
      })
      .then(() => {
        cy.get(selectors.domains.copyDomainButton).click()
        cy.verifyToast('Successfully copied!')
        cy.get(selectors.domains.confirmButton).click()
        cy.verifyToast(
          'Succesfully created!',
          'The domain is now available in the Domain management section.'
        )

        // Act
        cy.openProduct('Real-Time Purge')
        cy.get(selectors.purge.createButton).click()
        cy.get(selectors.purge.argumentsField).type(`${generatedDomainUrl}/test/purge.jpg`)
        cy.get(selectors.form.actionsSubmitButton).click()
        cy.verifyToast(
          'success',
          `The purge is queued for execution. It’ll appear in the history once completed.`
        )
      })
  })
})
