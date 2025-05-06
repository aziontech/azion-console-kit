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
  cy.get(selectors.workload.pageTitle(edgeAppName)).should('have.text', edgeAppName)
  cy.get(selectors.form.actionsCancelButton).click()
  // Assert
 
}

describe('Domains spec', { tags: ['@dev3', '@xfail'] }, () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/account/info', {
      fixture: '/account/info/without_flags.json'
  }).as('accountInfo')
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
    cy.get(selectors.workload.edgeApplicationField).click()
    cy.get(selectors.workload.edgeApplicationDropdownSearch).clear()
    cy.get(selectors.workload.edgeApplicationDropdownSearch).type(edgeAppName)
    cy.get(selectors.workload.edgeApplicationOption).click()
    cy.get(selectors.workload.cnamesField).type(`${domainName}.net`)
    cy.get(selectors.workload.enableMtlsSwitch).click()


    cy.wait('@getTrustedCACertificate').its('response.statusCode').should('eq', 200)
    cy.wait('@getTrustedCACertificate')
    cy.get(selectors.workload.dropdownTrustedCA).click()
    cy.get(selectors.workload.mtlsTrustedCADropdownFilter).clear()
    cy.get(selectors.workload.mtlsTrustedCADropdownFilter).type(digitalCertificateName)
    cy.wait('@getTrustedCACertificateByName')
    cy.get(selectors.workload.trustedCAFirstDropdownOption).click()

    // Act
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.get(selectors.workload.dialogTitle).should('have.text', 'Workload has been created')
    cy.get(selectors.workload.copyDomainButton).click()
    cy.verifyToast('Successfully copied!')
    cy.get(selectors.workload.confirmButton).click()
    cy.wait('@getDomain')
    cy.get(selectors.workload.editPageTitle).should('have.text', 'Edit Workload')
  })
})
