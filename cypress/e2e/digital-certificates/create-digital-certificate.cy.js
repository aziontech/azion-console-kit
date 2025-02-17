import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

const digitalCertificateName = generateUniqueName('CertificateName')

describe('Digital Certificates spec', { tags: ['@dev3'] }, () => {
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
    cy.intercept('GET', '/api/v4/digital_certificates/certificates*').as('getDigitalCertificates')
    cy.get(selectors.list.searchInput).type(`${digitalCertificateName}{enter}`)
    cy.wait('@getDigitalCertificates')
    cy.get(selectors.list.filteredRow.column('name')).find(selectors.list.showMore).click()
    cy.get(selectors.list.filteredRow.column('name')).contains(digitalCertificateName)
    cy.get(selectors.list.filteredRow.statusColumn).should('have.text', 'Pending')
  })
})
