import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

const digitalCertificateName = generateUniqueName('CertificateName')

describe('Digital Certificates spec', { tags: ['@dev13'] }, () => {
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
    cy.get(selectors.digitalCertificates.breadcrumbReturnToList).click()
    cy.get(selectors.list.searchInput).clear()
    cy.get(selectors.list.searchInput).type(digitalCertificateName)
    cy.get(selectors.list.filteredRow.column('name')).should('have.text', digitalCertificateName)
    cy.get(selectors.list.filteredRow.statusColumn).should('have.text', 'Pending')
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