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

describe('Domains spec', () => {
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
    cy.get(selectors.domains.edgeApplicationDropdownFilter).type(edgeAppName)
    cy.get(selectors.domains.edgeApplicationOption).click()
    cy.get(selectors.domains.cnamesField).type(`${domainName}.edge.app`)

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

  afterEach(() => {
    // Cleanup
    cy.deleteEntityFromList({ entityName: domainName, productName: 'Domains' }).then(() => {
      cy.verifyToast('Resource successfully deleted')
    })
    cy.deleteEntityFromList({ entityName: edgeAppName, productName: 'Edge Application' })
  })
})