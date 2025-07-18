import selectors from '../../support/selectors'
import generateUniqueName from '../../support/utils'
import { privateKeyCertificate, certificate } from '../../fixtures/digital-certificates'

let certificateName
const digitalCertificateName = generateUniqueName('CertificateName')

const createDigitalCertificate = () => {
  // Arrange
  cy.openProduct('Digital Certificates')

  cy.get(selectors.digitalCertificates.createDigitalCertificateButton).click()
  cy.get(selectors.digitalCertificates.clickImportServerCertificate).click()

  cy.get(selectors.digitalCertificates.digitalCertificateName).clear()
  cy.get(selectors.digitalCertificates.digitalCertificateName).type(digitalCertificateName)

  cy.get(selectors.digitalCertificates.serverCertificateTextArea).click()
  cy.get(selectors.digitalCertificates.serverCertificateTextArea).type(certificate)
  cy.get(selectors.digitalCertificates.privateKeyTextArea).click()
  cy.get(selectors.digitalCertificates.privateKeyTextArea).type(privateKeyCertificate)

  // Act
  cy.get(selectors.form.submitButton).click()

  // Assert
  cy.verifyToastWithAction('success', 'Your digital certificate has been created!')
  cy.get(selectors.form.editPageTitle).should('have.text', 'Edit Digital Certificate')
}

describe('Domains spec', { tags: ['@dev3'] }, () => {
  beforeEach(() => {
    cy.login()
  })

  it('should edit a digital certificate successfully', () => {
    createDigitalCertificate()
    certificateName = generateUniqueName('CertificateName')

    // Arrange
    cy.get(selectors.digitalCertificates.digitalCertificateName).clear()
    cy.get(selectors.digitalCertificates.digitalCertificateName).type(certificateName)

    // Act
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert - edit a domain
    cy.verifyToast('success', 'Your digital certificate has been updated!')

    cy.get(selectors.list.searchInput).clear()
    cy.intercept('GET', '/v4/digital_certificates/certificates*').as('getDigitalCertificates')
    cy.get(selectors.list.searchInput).type(`${certificateName}{enter}`)
    cy.wait('@getDigitalCertificates')
    cy.get(selectors.list.filteredRow.column('name')).find(selectors.list.showMore).click()
    cy.get(selectors.list.filteredRow.column('name')).contains(certificateName)
  })
})
