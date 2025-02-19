import selectors from '../../support/selectors'
import generateUniqueName from '../../support/utils'
import fixtures from '../../fixtures/digital-certificates'

let domainName
let edgeAppName
let digitalCertificateName

const createTrustedCADigitalCertificateCase = () => {
  // Arrange
  digitalCertificateName = generateUniqueName('CertificateName')
  cy.openProduct('Digital Certificates')
  cy.get(selectors.digitalCertificates.createDigitalCertificateButton).click()
  cy.get(selectors.digitalCertificates.digitalCertificateName).clear()
  cy.get(selectors.digitalCertificates.digitalCertificateName).type(digitalCertificateName)
  cy.get(selectors.digitalCertificates.importTrustedCARadioOption).click()
  cy.get(selectors.digitalCertificates.trustedCATextArea).type(fixtures.templateCertificate, {
    delay: 0
  })

  // Act
  cy.get(selectors.form.submitButton).click()

  // Assert
  cy.verifyToast('success', 'Your digital certificate has been created!')
  cy.get(selectors.digitalCertificates.editPageTitle).should(
    'have.text',
    'Edit Digital Certificate'
  )
  cy.get(selectors.digitalCertificates.trustedCATextArea).should('have.text', '')
}

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
  cy.get(selectors.domains.pageTitle(edgeAppName)).should('have.text', edgeAppName)
  cy.get(selectors.form.actionsCancelButton).click()
  // Assert
 
}

describe('Domains spec', { tags: ['@dev3'] }, () => {
  beforeEach(() => {
    cy.login()
  })

  it('should create and delete a domain with a mTLS digital certificate', () => {
    // Arrange
    createTrustedCADigitalCertificateCase()
    createEdgeApplicationCase()
    domainName = generateUniqueName('domain')
    cy.openProduct('Domains')
    cy.intercept(
      'GET',
      '/api/v4/edge_application/applications?ordering=name&page=1&page_size=100&fields=&search='
    ).as('getEdgeApplicationList')
    cy.intercept(
      'GET',
      '/api/v4/digital_certificates/certificates?ordering=name&page=1&page_size=100&fields=*&search=&type=*'
    ).as('getTrustedCACertificate')
    cy.intercept(
      'GET',
      `/api/v4/digital_certificates/certificates?ordering=name&page=1&page_size=100&fields=*&search=${digitalCertificateName}&type=*`
    ).as('getTrustedCACertificateByName')

    cy.intercept('GET', '/api/v4/workspace/workloads/*').as('getDomain')


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

    cy.wait('@getEdgeApplicationList')
    cy.get(selectors.domains.edgeApplicationField).click()
    cy.get(selectors.domains.edgeApplicationDropdownSearch).clear()
    cy.get(selectors.domains.edgeApplicationDropdownSearch).type(edgeAppName)
    cy.get(selectors.domains.edgeApplicationOption).click()
    cy.get(selectors.domains.cnamesField).type(`${domainName}.net`)
    cy.get(selectors.domains.enableMtlsSwitch).click()


    cy.wait('@getTrustedCACertificate').its('response.statusCode').should('eq', 200)
    cy.wait('@getTrustedCACertificate')
    cy.get(selectors.domains.dropdownTrustedCA).click()
    cy.get(selectors.domains.mtlsTrustedCADropdownFilter).clear()
    cy.get(selectors.domains.mtlsTrustedCADropdownFilter).type(digitalCertificateName)
    cy.wait('@getTrustedCACertificateByName')
    cy.get(selectors.domains.trustedCAFirstDropdownOption).click()

    // Act
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.get(selectors.domains.dialogTitle).should('have.text', 'Domain has been created')
    cy.get(selectors.domains.copyDomainButton).click()
    cy.verifyToast('Successfully copied!')
    cy.get(selectors.domains.confirmButton).click()
    cy.wait('@getDomain')
    cy.get(selectors.domains.editPageTitle).should('have.text', 'Edit Domain')
  })
})
