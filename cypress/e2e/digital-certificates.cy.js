import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'
import fixtures from '../fixtures/digital-certificates'

const digitalCertificateName = generateUniqueName('CertificateName')

describe('Digital Certificates spec', () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Digital Certificates')
  })

  it('should create a new digital certificate', function () {
    // Arrange
    cy.get(selectors.digitalCertificates.createDigitalCertificateButton).click()
    cy.get(selectors.digitalCertificates.digitalCertificateName).clear()
    cy.get(selectors.digitalCertificates.digitalCertificateName).type(digitalCertificateName)

    // Act
    cy.get(selectors.form.submitButton).click()

    // Assert
    cy.verifyToast('success', 'Your digital certificate has been created!')
    cy.get(selectors.form.editPageTitle).should('have.text', 'Edit Digital Certificate')
    cy.get(selectors.digitalCertificates.breadcumbReturnToList).click()
    cy.get(selectors.list.searchInput).clear()
    cy.get(selectors.list.searchInput).type(digitalCertificateName)
    cy.get(selectors.list.filteredRow.column('name')).should('have.text', digitalCertificateName)
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

  it('should request a Certificate Signing Request (CSR)', function () {
    // Arrange
    cy.get(selectors.digitalCertificates.createDigitalCertificateButton).click()
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
    // Act
    cy.get(selectors.form.submitButton).click()

    // Assert
    cy.verifyToast('success', 'Your digital certificate has been created!')
    cy.get(selectors.digitalCertificates.editPageTitle).should(
      'have.text',
      'Edit Digital Certificate'
    )
    cy.get(selectors.digitalCertificates.csrLabel).should(
      'have.text',
      'Certificate Signing Request (CSR) '
    )
    cy.get(selectors.digitalCertificates.copyCsrButton).click()
    cy.get(selectors.digitalCertificates.copyCsrMessage).should('have.text', 'Successfully copied!')
  })

  it.only('should import a server certificate', function () {
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

  afterEach(() => {
    // Delete the digital certificate
    cy.deleteEntityFromList({
      entityName: digitalCertificateName,
      productName: 'Digital Certificates'
    }).then(() => {
      cy.verifyToast('Digital certificate successfully deleted!')
    })
  })
})
