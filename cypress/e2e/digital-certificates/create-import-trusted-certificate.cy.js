import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'
import { certificate } from '../../fixtures/digital-certificates'

const digitalCertificateName = generateUniqueName('CertificateName')

describe('Digital Certificates spec', { tags: ['@dev3'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Digital Certificates')
  })

  it('should create a truted CA digital certificate', function () {
    // Arrange
    cy.get(selectors.digitalCertificates.createDigitalCertificateButton).click()
    cy.get(selectors.digitalCertificates.clickImportTrustedCertificate).click()

    cy.get(selectors.digitalCertificates.digitalCertificateName).clear()
    cy.get(selectors.digitalCertificates.digitalCertificateName).type(digitalCertificateName)

    cy.get(selectors.digitalCertificates.serverCertificateTextArea).clear()
    cy.get(selectors.digitalCertificates.serverCertificateTextArea).type(certificate)

    // Act
    cy.get(selectors.form.submitButton).click()

    // Assert
    cy.verifyToastWithAction('success', 'Your digital certificate has been created!')
    cy.get(selectors.digitalCertificates.editPageTitle).should(
      'have.text',
      'Edit Digital Certificate'
    )
  })
})
