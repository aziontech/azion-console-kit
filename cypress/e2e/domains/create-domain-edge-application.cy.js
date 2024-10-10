import selectors from '../../support/selectors'
import generateUniqueName from '../../support/utils'

let domainName
let edgeAppName
let digitalCertificateName
const createEdgeApplicationCase = () => {
  edgeAppName = generateUniqueName('EdgeApp')
  // Arrange
  cy.get(selectors.edgeApplication.mainSettings.nameInput).type(edgeAppName)
  cy.get(selectors.edgeApplication.mainSettings.addressInput).type(`${edgeAppName}.edge.app`)

  // Act
  cy.get(selectors.domains.edgeApplicationDrawer).find(selectors.form.actionsSubmitButton).click()

  // Assert
  cy.verifyToast('success', 'Your edge application has been created')
}

const createDigitalCertificateCase = () => {
  digitalCertificateName = generateUniqueName('digitalCertificate')
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
  cy.get(selectors.domains.digitalCertificateActionBar)
    .find(selectors.form.actionsSubmitButton)
    .click()

  // Assert
  cy.verifyToast('success', 'Your digital certificate has been created!')
}

describe('Domains spec', { tags: ['@dev3', '@xfail'] }, () => {
  beforeEach(() => {
    cy.login()
  })

  it('should create and delete a domain using a edge application', () => {
    domainName = generateUniqueName('domain')

    // Arrange
    cy.openProduct('Domains')
    cy.get(selectors.domains.createButton).click()
    cy.get(selectors.domains.nameInput).type(domainName)
    cy.get(selectors.domains.edgeApplicationField).click()
    cy.get(selectors.domains.createEdgeApplicationButton).click()
    createEdgeApplicationCase()
    cy.get(selectors.domains.edgeApplicationField).click()
    cy.get(selectors.domains.edgeApplicationDropdownFilter).type(edgeAppName)
    cy.get(selectors.domains.edgeApplicationOption).click()
    cy.get(selectors.domains.cnamesField).type(`${domainName}.edge.app`)

    cy.get(selectors.domains.digitalCertificateDropdown).click()
    cy.get(selectors.domains.createDigitalCertificateButton).click()
    createDigitalCertificateCase()
    cy.get(selectors.domains.digitalCertificateDropdown).click()
    cy.get(selectors.domains.digitalCertificateDropdownFilter).type(digitalCertificateName)
    cy.get(selectors.domains.edgeCertificateOption).click()
    // Act
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('error', 'digital_certificate_id: cannot set a pending certificate to a domain')

    cy.get(selectors.domains.digitalCertificateDropdown).click()
    cy.get(selectors.domains.digitalCertificateDropdownFilter).clear()
    cy.get(selectors.domains.edgeCertificateOption).click()
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.get(selectors.domains.dialogTitle).should('have.text', 'Domain has been created')
    cy.get(selectors.domains.domainField).should('be.visible')
    cy.get(selectors.domains.copyDomainButton).click()
    cy.verifyToast('Successfully copied!')
    cy.get(selectors.domains.confirmButton).click()
    cy.verifyToast(
      'Succesfully created!',
      'The domain is now available in the Domain management section.'
    )
  })

  afterEach(() => {
    // Cleanup
    cy.deleteEntityFromList({ entityName: domainName, productName: 'Domains' }).then(() => {
      cy.verifyToast('Resource successfully deleted')
    })
    cy.deleteEntityFromList({ entityName: edgeAppName, productName: 'Edge Application' })
  })
})
