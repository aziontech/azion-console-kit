import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let variableKey
let variableValue

describe('Variables spec', { tags: ['@dev7'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Variables')

    variableKey = generateUniqueName('KEY')
    variableValue = generateUniqueName('value')
  })

  it('should create a variable', function () {
    // Arrange
    cy.get(selectors.variables.createButton).click()

    // Act
    cy.get(selectors.variables.keyInput).type(variableKey)
    cy.get(selectors.variables.valueInput).type(variableValue)
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your variable has been created')

    // Assert
    cy.get(selectors.list.searchInput).type(`${variableKey}{enter}`)
    cy.get(selectors.variables.listRow('key')).should('have.text', variableKey)
    cy.get(selectors.variables.listRow('value')).find('button').should('be.visible')
  })
})
