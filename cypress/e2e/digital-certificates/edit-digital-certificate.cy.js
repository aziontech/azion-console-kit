import selectors from '../../support/selectors'
import generateUniqueName from '../../support/utils'

let certificateName
const digitalCertificateName = generateUniqueName('CertificateName')

const createDigitalCertificate = () => {
  // Arrange
  cy.openProduct('Digital Certificates')

  cy.get(selectors.digitalCertificates.createDigitalCertificateButton).click()
  cy.get(selectors.digitalCertificates.digitalCertificateName).clear()
  cy.get(selectors.digitalCertificates.digitalCertificateName).type(digitalCertificateName)

  // Act
  cy.get(selectors.form.submitButton).click()

  // Assert
  cy.verifyToast('success', 'Your digital certificate has been created!')
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

    cy.get(selectors.digitalCertificates.breadcrumbReturnToList).click()
    cy.get(selectors.list.searchInput).clear()
    cy.intercept('GET', '/api/v4/digital_certificates/certificates*').as('getDigitalCertificates')
    cy.get(selectors.list.searchInput).type(`${certificateName}{enter}`)
    cy.wait('@getDigitalCertificates')
    cy.get(selectors.list.filteredRow.column('name')).find(selectors.list.showMore).click()
    cy.get(selectors.list.filteredRow.column('name')).contains(certificateName)
    cy.get(selectors.list.filteredRow.statusColumn).should('have.text', 'Pending')
  })

  afterEach(() => {
    // Cleanup
    cy.deleteEntityFromList({
      entityName: certificateName,
      productName: 'Digital Certificates'
    }).then(() => {
      cy.verifyToast('Digital certificate successfully deleted!')
    })
  })
})
