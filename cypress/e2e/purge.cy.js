import selectors from '../support/selectors'
import generateUniqueName from '../support/utils'

let domainName
let edgeAppName
let generatedDomainUrl

describe('Real-time Purge spec', () => {
  beforeEach(() => {
    cy.login()
  })

  it.skip('should create a Real-Time Purge using a domain', () => {
    // Arrange
    domainName = generateUniqueName('domain')
    edgeAppName = generateUniqueName('edgeApp')
    cy.openProduct('Edge Application')
    cy.get(selectors.edgeApplication.createButton).click()
    cy.get(selectors.edgeApplication.nameInput).type(edgeAppName)
    cy.get(selectors.edgeApplication.addressInput).type(`${edgeAppName}.edge.app`)

    // Act
    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert - create a edge application
    cy.verifyToast('success', 'Your edge application has been created')
    cy.get(selectors.domains.pageTitle(edgeAppName)).should('have.text', edgeAppName)

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

    // Assert - create a domain
    cy.get(selectors.domains.dialogTitle).should('have.text', 'Domain has been created')
    cy.get(selectors.domains.domainField)
      .then(($el) => {
        generatedDomainUrl = $el.val()
      })
      .then(() => {
        cy.get(selectors.domains.copyDomainButton).click()
        cy.verifyToast('Successfully copied!')
        cy.get(selectors.domains.confirmButton).click()
        cy.verifyToast(
          'Succesfully created!',
          'The domain is now available in the Domain management section.'
        )

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
