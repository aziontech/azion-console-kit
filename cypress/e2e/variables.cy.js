import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

const variableName = generateUniqueName('VARIABLE')

describe('Variables spec', () => {
  beforeEach(() => {
    cy.login()
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
  })
  afterEach(() => {
    // Delete the variable
    cy.deleteProduct(variableName, '/variables')
  })
})
