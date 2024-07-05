import generateUniqueName from '../support/utils';
import selectors from '../support/selectors';

const digitalCertificateName = generateUniqueName('CertificateName')

describe('Digital Certificates spec', () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Digital Certificates')
  })

  it('should create and delete a new digital certificate', function () {
    // Arrange
    cy.get(selectors.list.createDigitalCertificateButton).click()

    // Act
    cy.get(selectors.form.digitalCertificateName).clear()
    cy.get(selectors.form.digitalCertificateName).type(digitalCertificateName)
    cy.get(selectors.form.submitButton).click()

    // Assert
    cy.verifyToast('success', 'Your digital certificate has been created!')
    cy.get(selectors.form.editPageTitle).should('have.text', 'Edit Digital Certificate')
    cy.get(selectors.list.breadcumbReturnToList).click()
    cy.get(selectors.list.searchInput).clear()
    cy.get(selectors.list.searchInput).type(digitalCertificateName)
    cy.get(selectors.list.filteredRow.nameColumn()).should('have.text', digitalCertificateName)
    cy.get(selectors.list.filteredRow.statusColumn).should(
      'have.text',
      'Pending'
    )
  })

  afterEach(() => {
    // Delete the digital certificate
    cy.deleteProduct({ entityName: digitalCertificateName, productName: 'Digital Certificates' })
  })
})
