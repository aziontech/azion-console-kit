import selectors from '../../support/selectors'
import generateUniqueName from '../../support/utils'

let domainName
let edgeAppName

let domainEditedName
let digitalCertificateName

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

const createDigitalCertificate = () => {
  digitalCertificateName = generateUniqueName('digitalCertificate')

  cy.get(selectors.domains.digitalCertificatesDropdownLetsEncrypt).click()
  cy.get(selectors.domains.createDigitalCertificateButton).click()
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

  cy.intercept('GET', '/api/v4/digital_certificates/certificates/*?fields=*').as('getDigitalCertificatesApi')

  // Act
  cy.get(selectors.domains.digitalCertificateActionBar)
    .find(selectors.form.actionsSubmitButton)
    .click()

  // Assert
  cy.verifyToast('success', 'Your digital certificate has been created!')
  cy.wait('@getDigitalCertificatesApi')

  cy.get(selectors.domains.digitalCertificatesDropdownLetsEncrypt).should('have.text', digitalCertificateName)
  cy.get(selectors.domains.digitalCertificatesDropdownLetsEncrypt).click()
  cy.get(selectors.domains.letsEncryptDropdownOption).click()
}

describe('Domains spec', { tags: ['@dev3'] }, () => {
  beforeEach(() => {
    cy.login()
  })

  it('should edit a domain successfully', () => {
    createEdgeApplicationCase()
    domainName = generateUniqueName('domain')

    // Arrange
    cy.openProduct('Domains')
    cy.intercept('GET', '/api/v4/edge_application/applications?ordering=name&page=1&page_size=100&fields=&search=').as('getEdgeApplicationList')
    cy.intercept('GET', `/api/v4/edge_application/applications?ordering=name&page=1&page_size=100&fields=&search=${edgeAppName}`).as('getEdgeApplicationListFilter')
    cy.get(selectors.domains.createButton).click()
    cy.get(selectors.domains.nameInput).type(domainName)

    // protocol section
    cy.get(selectors.domains.portHttp).click()
    cy.get(selectors.domains.dropdownSelectPort).find('li').eq(2).click()
    cy.get(selectors.domains.dropdownSelectPort).find('li').eq(3).click()
    cy.get(selectors.domains.portHttp).click()

    cy.get(selectors.domains.useHttpsField).click()
    cy.get(selectors.domains.portHttps).click()
    cy.get(selectors.domains.dropdownSelectPort).find('li').eq(2).click()
    cy.get(selectors.domains.dropdownSelectPort).find('li').eq(4).click()
    cy.get(selectors.domains.portHttps).click()
    cy.get(selectors.domains.tlsVersion).click()
    cy.get(selectors.domains.dropdownSelectTls).find('li').eq(2).click()
    cy.get(selectors.domains.cipherSuite).click()
    cy.get(selectors.domains.dropdownSelectCipher).find('li').eq(2).click()

    cy.wait('@getEdgeApplicationList')
    cy.get(selectors.domains.edgeApplicationField).click()
    cy.get(selectors.domains.edgeApplicationDropdownSearch).clear()
    cy.get(selectors.domains.edgeApplicationDropdownSearch).type(edgeAppName)

    cy.wait('@getEdgeApplicationListFilter')
    cy.get(selectors.domains.edgeApplicationOption).click()
    cy.get(selectors.domains.cnamesField).type(`${domainName}.net`)

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

    domainEditedName = `${domainName}-edit`

    // Act
    cy.get(selectors.domains.fieldTextInput).should('have.value', domainName)
    cy.get(selectors.domains.fieldTextInput).clear()
    cy.get(selectors.domains.fieldTextInput).type(domainEditedName)
    cy.get(selectors.domains.cnamesField).clear()
    cy.get(selectors.domains.cnamesField).type(`${domainName}-edit.net`)

    createDigitalCertificate()

    cy.get(selectors.domains.domainUri).should('be.disabled')
    cy.get(selectors.domains.editFormCopyDomainButton).should('be.visible')
    cy.get(selectors.domains.activeSwitchEditForm).click()
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.verifyToast('success', 'Your domain has been edited')
    cy.get(selectors.domains.dataTableSearchInput).clear()
    cy.get(selectors.domains.dataTableSearchInput).type(`${domainEditedName}{enter}`)
    cy.get(selectors.domains.listTableBlockColumnNameRow).should('have.text', domainEditedName)
    cy.get(selectors.domains.listTableBlockColumnActiveRow).should('have.text', 'Inactive')
  })

  afterEach(() => {
    // Cleanup
    cy.deleteEntityFromList({ entityName: domainName, productName: 'Domains' }).then(() => {
      cy.verifyToast('Domain successfully deleted')
    })
    cy.deleteEntityFromList({ entityName: edgeAppName, productName: 'Edge Application' })
  })
})
