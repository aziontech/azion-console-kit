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
    cy.intercept('POST', 'api/v4/edge_application/applications*').as('createEdgeApp')
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.wait('@createEdgeApp')
    cy.verifyToast('success', 'Your edge application has been created')
    cy.get(selectors.form.actionsSkipButton).click()
    cy.get(selectors.edgeApplication.mainSettings.unsaved).click()

    // Assert - create a edge application
    cy.get(selectors.workload.pageTitle(edgeAppName)).should('have.text', edgeAppName)

    // Arrange
    cy.openProduct('Domains')
    cy.intercept(
      'GET',
      '/api/v4/edge_application/applications?ordering=name&page=1&page_size=100&fields=&search='
    ).as('getEdgeApplicationList')
    cy.get(selectors.workload.createButton).click()
    cy.get(selectors.workload.nameInput).type(domainName)

    // protocol section
    cy.get(selectors.workload.portHttp).click()
    cy.get(selectors.workload.dropdownSelectPort).find('li').eq(2).click()
    cy.get(selectors.workload.dropdownSelectPort).find('li').eq(3).click()
    cy.get(selectors.workload.portHttp).click()

    cy.get(selectors.workload.useHttpsField).click()
    cy.get(selectors.workload.portHttps).click()
    cy.get(selectors.workload.dropdownSelectPort).find('li').eq(2).click()
    cy.get(selectors.workload.dropdownSelectPort).find('li').eq(4).click()
    cy.get(selectors.workload.portHttps).click()
    cy.get(selectors.workload.tlsVersion).click()
    cy.get(selectors.workload.dropdownSelectTls).find('li').eq(2).click()
    cy.get(selectors.workload.cipherSuite).click()
    cy.get(selectors.workload.dropdownSelectCipher).find('li').eq(2).click()

    cy.wait('@getEdgeApplicationList')
    cy.get(selectors.workload.edgeApplicationField).click()

    cy.get(selectors.workload.edgeApplicationDropdownSearch).clear()
    cy.get(selectors.workload.edgeApplicationDropdownSearch).type(edgeAppName)
    cy.get(selectors.workload.edgeApplicationOption).click()
    cy.get(selectors.workload.cnamesField).type(`${domainName}.net`)

    // Act
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert - create a domain
    cy.get(selectors.workload.dialogTitle).should('have.text', 'Workload has been created')
    cy.get(selectors.workload.domainField)
      .then(($el) => {
        generatedDomainUrl = $el.val()
      })
      .then(() => {
        cy.intercept('GET', '/api/v4/workspace/workloads/*').as('getWorkload')
        cy.get(selectors.workload.copyDomainButton).click()
        cy.verifyToast('Successfully copied!')
        cy.get(selectors.workload.confirmButton).click()
        cy.verifyToast(
          'Succesfully created!',
          'The domain is now available in the Workload management section.'
        )        
        cy.wait('@getWorkload')

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
})
