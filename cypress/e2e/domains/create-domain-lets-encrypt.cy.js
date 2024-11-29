import selectors from '../../support/selectors'
import generateUniqueName from '../../support/utils'

let domainName
let edgeAppName

const createEdgeApplicationCase = () => {
  // Arrange
  edgeAppName = generateUniqueName('edgeApp')
  cy.openProduct('Edge Application')
  cy.get(selectors.edgeApplication.mainSettings.createButton).click()
  cy.get(selectors.edgeApplication.mainSettings.nameInput).type(edgeAppName)
  cy.get(selectors.edgeApplication.mainSettings.addressInput).type(`${edgeAppName}.edge.app`)

  // Act
  cy.get(selectors.form.actionsSubmitButton).click()

  // Assert
  cy.verifyToast('success', 'Your edge application has been created')
  cy.get(selectors.domains.pageTitle(edgeAppName)).should('have.text', edgeAppName)
}

describe('Domains spec', { tags: ['@dev3', '@xfail'] }, () => {
  beforeEach(() => {
    cy.login()
  })

  it('should create and delete a domain with a lets encrypt digital certificate', () => {
    // Arrange
    createEdgeApplicationCase()
    domainName = generateUniqueName('domain')
    cy.openProduct('Domains')
    cy.intercept('GET', '/api/v4/edge_application/applications?ordering=name&page=1&page_size=100&fields=&search=').as('getEdgeApplicationList')
    cy.intercept('GET', '/api/v4/digital_certificates/certificates?ordering=name&page=1&page_size=100&fields=id%2Cname&search=&type=*').as('searchDigitalCertificatesApi')
    cy.intercept('GET', `/api/v4/digital_certificates/certificates?ordering=name&page=1&page_size=100&fields=id%2Cname&search=${domainName}&type=*`).as('searchDigitalCertificatesApiByDomain')

    cy.get(selectors.domains.createButton).click()
    cy.get(selectors.domains.nameInput).type(domainName)

    cy.wait('@getEdgeApplicationList')
    cy.get(selectors.domains.edgeApplicationField).click()
    cy.get(selectors.domains.edgeApplicationDropdownSearch).clear()
    cy.get(selectors.domains.edgeApplicationDropdownSearch).type(edgeAppName)
    cy.get(selectors.domains.edgeApplicationOption).click()
    cy.get(selectors.domains.cnamesField).type(`${domainName}.net`)

    cy.wait('@searchDigitalCertificatesApi')
    cy.get(selectors.domains.digitalCertificateDropdown).click()
    cy.get(selectors.domains.letsEncryptDropdownOption).click()

    // Act
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.get(selectors.domains.dialogTitle).should('have.text', 'Domain has been created')
    cy.get(selectors.domains.copyDomainButton).click()
    cy.verifyToast('Successfully copied!')
    cy.get(selectors.domains.confirmButton).click()
    cy.get(selectors.domains.editPageTitle).should('have.text', 'Edit Domain')

    cy.wait('@searchDigitalCertificatesApi')
    cy.get(selectors.domains.digitalCertificatesDropdownLetsEncrypt).click()
    cy.get(selectors.domains.digitalCertificateDropdownSearch).clear()
    cy.get(selectors.domains.digitalCertificateDropdownSearch).type(domainName)

    cy.wait('@searchDigitalCertificatesApiByDomain')
    cy.get(selectors.domains.edgeCertificateOption).click()
    cy.get(selectors.domains.edgeCertificateOption).should('be.visible')
  })

  afterEach(() => {
    // Cleanup
    cy.deleteEntityFromList({ entityName: domainName, productName: 'Domains' }).then(() => {
      cy.verifyToast('Resource successfully deleted')
    })
    cy.deleteEntityFromList({ entityName: edgeAppName, productName: 'Edge Application' })
  })
})