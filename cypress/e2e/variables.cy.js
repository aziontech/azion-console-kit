import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

const variableKey = generateUniqueName('VARIABLE')
const variableValue = generateUniqueName('myvalue')

describe('Variables spec', () => {
  beforeEach(() => {
    cy.login()
    cy.openProductThroughSidebar('variables')
  })

  it('Create a variable', function() {
    // Act
    cy.get(selectors.variables.createButton).click()
    cy.get(selectors.variables.keyInput).type(variableKey)
    cy.get(selectors.variables.valueInput).type(variableValue)
    cy.get(selectors.variables.saveButton).click()
    cy.verifyToast('success', 'Your variable has been created')
    cy.get(selectors.variables.cancelButton).click()

    // Assert
    cy.get(selectors.variables.searchInput).type(`${variableKey}`)
    cy.get(selectors.variables.keyRow).should('have.text', variableKey)
    cy.get(selectors.variables.valueRow).should('have.text', variableValue)
  })
  afterEach(() => {
    // Delete the variable
    cy.deleteProduct(variableKey, 'key', '/variables')
  })
})
