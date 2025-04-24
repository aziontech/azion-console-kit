import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'
import fixtures from '../../fixtures/digital-certificates'

const digitalCertificateName = generateUniqueName('CertificateName')

describe('Digital Certificates spec', { tags: ['@dev3'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Digital Certificates')
  })

  it('should import a server certificate', function () {
    // Arrange
    cy.get(selectors.digitalCertificates.createDigitalCertificateButton).click()
    cy.get(selectors.digitalCertificates.digitalCertificateName).clear()
    cy.get(selectors.digitalCertificates.digitalCertificateName).type(digitalCertificateName)
    cy.get(selectors.digitalCertificates.serverCertificateTextArea).type(
      fixtures.templateCertificate,
      { delay: 0 }
    )

    // Act
    cy.get(selectors.form.submitButton).click()

    // Assert
    cy.verifyToast('success', 'Your digital certificate has been created!')
    cy.get(selectors.form.editPageTitle).should('have.text', 'Edit Digital Certificate')
  })
})
