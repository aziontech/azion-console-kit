import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

let variableName = ''

describe('Variables spec', () => {
  beforeEach(() => {
    cy.login()
    variableName = generateUniqueName('VARIABLE')
    cy.openProductThroughSidebar('variables')
  })

  it('Create a variable', function() {
    // Act
    cy.get(selectors.variables.createButton).click()
    cy.get(selectors.variables.keyInput).clear('')
    cy.get(selectors.variables.keyInput).type(variableName)
    cy.get(selectors.variables.valueInput).clear()
    cy.get(selectors.variables.valueInput).type('myvalue')
    cy.get(selectors.variables.saveButton).click()
    cy.verifyToast('success', 'Your variable has been created')
    cy.get(selectors.variables.cancelButton).click()

    // Assert
    cy.get(selectors.variables.searchInput).clear()
    cy.get(selectors.variables.searchInput).type(`${variableName}{enter}`)
    cy.get(selectors.variables.keyRow).should('have.text', variableName)
    cy.get(selectors.variables.valueRow).should('have.text', 'myvalue')

    // Cleanup
    cy.get(selectors.variables.actionButton).click()
    cy.get(selectors.variables.deleteButton).click()
    cy.get(selectors.variables.deleteInput).clear()
    cy.get(selectors.variables.deleteInput).type('delete')
    cy.get(selectors.variables.confirmDeleteButton).click()
    cy.verifyToast('Variable successfully deleted')
  })
})
