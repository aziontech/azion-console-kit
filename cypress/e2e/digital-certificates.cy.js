import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'
import fixtures from '../fixtures/digital-certificates'

const digitalCertificateName = generateUniqueName('CertificateName')

describe('Digital Certificates spec', () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Digital Certificates')
  })

  it('should create and delete a new digital certificate', function () {
    // Arrange
    cy.get(selectors.digitalCertificates.createDigitalCertificateButton).click()

    // Act
    cy.get(selectors.digitalCertificates.digitalCertificateName).clear()
    cy.get(selectors.digitalCertificates.digitalCertificateName).type(digitalCertificateName)
    cy.get(selectors.form.submitButton).click()

    // Assert
    cy.verifyToast('success', 'Your digital certificate has been created!')
    cy.get(selectors.form.editPageTitle).should('have.text', 'Edit Digital Certificate')
    cy.get(selectors.digitalCertificates.breadcumbReturnToList).click()
    cy.get(selectors.list.searchInput).clear()
    cy.get(selectors.list.searchInput).type(digitalCertificateName)
    cy.get(selectors.list.filteredRow.nameColumn()).should('have.text', digitalCertificateName)
    cy.get(selectors.list.filteredRow.statusColumn).should('have.text', 'Pending')
  })

  it('should create a truted CA digital certificate', function () {
    // Arrange
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
  })

  afterEach(() => {
    // Delete the digital certificate
    cy.deleteProduct({ entityName: digitalCertificateName, productName: 'Digital Certificates' })
  })
})
