import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

const edgeServiceName = generateUniqueName('EdgeService')

describe('template spec', () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Edge Services')
  })

  it('should create and delete an edge service', () => {
    // Arrange
    cy.get(selectors.edgeServices.createServiceButton).click()

    // Act
    cy.get(selectors.edgeServices.serviceName).type(edgeServiceName)
    cy.get(selectors.edgeServices.submitButton).click()

    // Assert
    cy.verifyToast('success', 'Your Edge Service has been created')
    cy.get(selectors.edgeServices.pageTitle(edgeServiceName)).should('have.text', edgeServiceName)
    cy.get(selectors.edgeServices.cancelButton).click()
    cy.get(selectors.edgeServices.searchInput).type(edgeServiceName)
    cy.get(selectors.edgeServices.filteredRowNameColumn).should('have.text', edgeServiceName)

    cy.get(selectors.edgeServices.filteredRowStatusColumn).should('have.text', 'Inactive')

    // Cleanup
    cy.get(selectors.edgeServices.actionsMenuButton).click()
    cy.get(selectors.edgeServices.actionsMenuDeleteAction).click()
    cy.get(selectors.edgeServices.deleteDialogConfirmationInputField).clear()
    cy.get(selectors.edgeServices.deleteDialogConfirmationInputField).type('delete{enter}')
    cy.verifyToast('Resource successfully deleted')
  })
})
