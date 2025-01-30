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
    cy.window().then((win) => {
      const app = win.document.querySelector('#app').__vue_app__
      const router = app.config.globalProperties.$router
      router.push('/digital-certificates')
    })
    cy.get(selectors.list.searchInput).clear()
    cy.intercept('GET', '/api/v4/digital_certificates/certificates*').as('getDigitalCertificates')
    cy.get(selectors.list.searchInput).type(`${digitalCertificateName}{enter}`)
    cy.wait('@getDigitalCertificates')
    cy.get(selectors.list.filteredRow.column('name')).find(selectors.list.showMore).click()
    cy.get(selectors.list.filteredRow.column('name')).contains(digitalCertificateName)
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
