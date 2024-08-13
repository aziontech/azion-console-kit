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

  it('should edit a domain successfully', () => {
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
    cy.get(selectors.domains.cnamesField).type(`${domainName}-edit.edge.app`)
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