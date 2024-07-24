import selectors from '../support/selectors'
import generateUniqueName from '../support/utils'
import fixtures from '../fixtures/digital-certificates'

let domainName
let edgeAppName
let digitalCertificateName

const createTrustedCADigitalCertificateCase = () => {
  // Arrange
  digitalCertificateName = generateUniqueName('CertificateName')
  cy.openProduct('Digital Certificates')
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
}

const createEdgeApplicationCase = () => {
  // Arrange
  edgeAppName = generateUniqueName('edgeApp')
  cy.openProduct('Edge Application')
  cy.get(selectors.edgeApplication.createButton).click()
  cy.get(selectors.edgeApplication.nameInput).type(edgeAppName)
  cy.get(selectors.edgeApplication.addressInput).type(`${edgeAppName}.edge.app`)

  // Act
  cy.get(selectors.form.actionsSubmitButton).click()

  // Assert
  cy.verifyToast('success', 'Your edge application has been created')
  cy.get(selectors.domains.pageTitle(edgeAppName)).should('have.text', edgeAppName)
}

describe('Domains spec',  { tags: ['@xfail'] }, () => {
  beforeEach(() => {
    cy.login()
  })

  it('should create and delete a domain using a edge application', () => {
    createEdgeApplicationCase()
    domainName = generateUniqueName('domain')

    // Arrange
    cy.openProduct('Domains')
    cy.get(selectors.domains.createButton).click()
    cy.get(selectors.domains.nameInput).type(domainName)
    cy.get(selectors.domains.edgeApplicationField).click()
    cy.get(selectors.domains.dropdownFilter).type(edgeAppName)
    cy.get(selectors.domains.edgeApplicationOption).click()
    cy.get(selectors.domains.cnamesField).type(`${domainName}.domain.app`)

    // Act
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

  it('should create and delete a domain with a lets encrypt digital certificate', () => {
    // Arrange
    createEdgeApplicationCase()
    domainName = generateUniqueName('domain')
    cy.openProduct('Domains')
    cy.get(selectors.domains.createButton).click()
    cy.get(selectors.domains.nameInput).type(domainName)
    cy.get(selectors.domains.edgeApplicationField).click()
    cy.get(selectors.domains.dropdownFilter).type(edgeAppName)
    cy.get(selectors.domains.edgeApplicationOption).click()
    cy.get(selectors.domains.cnamesField).type(`${domainName}.domain.app`)
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
    // Verify if the selected digital certificate is the let's encrypt
    cy.get(selectors.domains.digitalCertificateFieldSelectedValue).should('contain', domainName)
  })

  it('should create and delete a domain with a mTLS digital certificate', () => {
    // Arrange
    createTrustedCADigitalCertificateCase()
    createEdgeApplicationCase()
    domainName = generateUniqueName('domain')
    cy.openProduct('Domains')
    cy.get(selectors.domains.createButton).click()
    cy.get(selectors.domains.nameInput).type(domainName)
    cy.get(selectors.domains.edgeApplicationField).click()
    cy.get(selectors.domains.dropdownFilter).type(edgeAppName)
    cy.get(selectors.domains.edgeApplicationOption).click()
    cy.get(selectors.domains.cnamesField).type(`${domainName}.domain.app`)
    cy.get(selectors.domains.enableMtlsSwitch).click()
    cy.get(selectors.domains.dropdownTrustedCA).click()
    cy.get(selectors.domains.dropdownFilter).clear()
    cy.get(selectors.domains.dropdownFilter).type(digitalCertificateName)
    cy.get(selectors.domains.trustedCAFirstDropdownOption).click()

    // Act
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.get(selectors.domains.dialogTitle).should('have.text', 'Domain has been created')
    cy.get(selectors.domains.copyDomainButton).click()
    cy.verifyToast('Successfully copied!')
    cy.get(selectors.domains.confirmButton).click()
    cy.get(selectors.domains.editPageTitle).should('have.text', 'Edit Domain')
    cy.get(selectors.domains.mtlsTrustedCAFieldSelectedValue).should(
      'contain',
      digitalCertificateName
    )
  })

  it('should edit a domain successfully', () => {
    createEdgeApplicationCase()
    domainName = generateUniqueName('domain')

    // Arrange
    cy.openProduct('Domains')
    cy.get(selectors.domains.createButton).click()
    cy.get(selectors.domains.nameInput).type(domainName)
    cy.get(selectors.domains.edgeApplicationField).click()
    cy.get(selectors.domains.dropdownFilter).type(edgeAppName)
    cy.get(selectors.domains.edgeApplicationOption).click()
    cy.get(selectors.domains.cnamesField).type(`${domainName}.app`)

    // Act
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert - create a domain
    cy.get(selectors.domains.dialogTitle).should('have.text', 'Domain has been created')
    cy.get(selectors.domains.domainField).should('be.visible')
    cy.get(selectors.domains.copyDomainButton).click()
    cy.verifyToast('Successfully copied!')
    cy.get(selectors.domains.confirmButton).click()
    cy.verifyToast(
      'Succesfully created!',
      'The domain is now available in the Domain management section.'
    )

    // Act
    cy.get(selectors.domains.fieldTextInput).should('have.value', domainName)
    cy.get(selectors.domains.fieldTextInput).clear()
    cy.get(selectors.domains.fieldTextInput).type(`${domainName}-edit`)
    cy.get(selectors.domains.cnamesField).clear()
    cy.get(selectors.domains.cnamesField).type(`${domainName}-edit.domain.app`)
    cy.get(selectors.domains.domainUri).should('be.disabled')
    cy.get(selectors.domains.editFormCopyDomainButton).should('be.visible')
    cy.get(selectors.domains.activeSwitchEditForm).click()
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.verifyToast('success', 'Your domain has been edited')
    cy.get(selectors.domains.dataTableSearchInput).clear()
    cy.get(selectors.domains.dataTableSearchInput).type(`${domainName}-edit`)
    cy.get(selectors.domains.listTableBlockColumnNameRow).should('have.text', `${domainName}-edit`)
    cy.get(selectors.domains.listTableBlockColumnActiveRow).should('have.text', 'Inactive')
  })

  afterEach(() => {
    // Cleanup
    cy.deleteEntityFromList({ entityName: domainName, productName: 'Domains' }).then(() => {
      cy.verifyToast('Resource successfully deleted')
    })
    cy.deleteEntityFromList({ entityName: edgeAppName, productName: 'Edge Application' })
  })
})
