import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'
import { privateKeyCertificate, certificate } from '../../fixtures/digital-certificates'

const digitalCertificateName = generateUniqueName('CertificateName')

describe('Digital Certificates spec', { tags: ['@dev3'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Digital Certificates')
  })

  it('should create a new digital certificate', function () {
    // Arrange
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
    cy.get(selectors.digitalCertificates.breadcrumbReturnToList).click()
    cy.get(selectors.list.searchInput).clear()
    cy.intercept('GET', '/v4/digital_certificates/certificates*').as('getDigitalCertificates')
    cy.get(selectors.list.searchInput).type(`${digitalCertificateName}{enter}`)
  })
})
