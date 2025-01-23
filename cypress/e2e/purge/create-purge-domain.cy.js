import selectors from '../../support/selectors'
import generateUniqueName from '../../support/utils'

let domainName
let edgeAppName
let generatedDomainUrl

describe('Real-time Purge spec', { tags: ['@dev6'] }, () => {
  beforeEach(() => {
    cy.login()
  })

  it('should create a Real-Time Purge using a domain', () => {
    // Arrange
    domainName = generateUniqueName('domain')
    edgeAppName = generateUniqueName('edgeApp')
    cy.openProduct('Edge Application')
    cy.get(selectors.edgeApplication.mainSettings.createButton).click()
    cy.get(selectors.edgeApplication.mainSettings.nameInput).type(edgeAppName)
    cy.get(selectors.edgeApplication.mainSettings.addressInput).type(`${edgeAppName}.edge.app`)

    // Act
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert - create a edge application
    cy.verifyToast('success', 'Your edge application has been created')
    cy.get(selectors.domains.pageTitle(edgeAppName)).should('have.text', edgeAppName)

    // Arrange
    cy.openProduct('Domains')
    cy.intercept('GET', '/api/v4/edge_application/applications?ordering=name&page=1&page_size=100&fields=&search=').as('getEdgeApplicationList')
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
    cy.get(selectors.domains.edgeApplicationOption).click()
    cy.get(selectors.domains.cnamesField).type(`${domainName}.net`)

    // Act
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert - create a domain
    cy.get(selectors.domains.dialogTitle).should('have.text', 'Domain has been created')
    cy.get(selectors.domains.domainField)
      .then(($el) => {
        generatedDomainUrl = $el.val()
      })
      .then(() => {
        cy.intercept('GET', '/api/v4/workspace/workloads/*').as('getDomain')
        cy.get(selectors.domains.copyDomainButton).click()
        cy.verifyToast('Successfully copied!')
        cy.get(selectors.domains.confirmButton).click()
        cy.verifyToast(
          'Succesfully created!',
          'The domain is now available in the Domain management section.'
        )        
        cy.wait('@getDomain')

        // Act
        cy.openProduct('Real-Time Purge')
        cy.get(selectors.purge.createButton).click()
        cy.get(selectors.purge.argumentsField).type(`${generatedDomainUrl}/test/purge.jpg`)
        cy.get(selectors.form.actionsSubmitButton).click()
        cy.verifyToast(
          'success',
          `The purge is queued for execution. It’ll appear in the history once completed.`
        )
      })
  })

  afterEach(() => {
    // Cleanup
    cy.deleteEntityFromList({ entityName: domainName, productName: 'Domains' }).then(() => {
      cy.verifyToast('Resource successfully deleted')
    })
    cy.deleteEntityFromList({ entityName: edgeAppName, productName: 'Edge Application' })
  })
})
