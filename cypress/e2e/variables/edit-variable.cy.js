import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let variableKey
let variableValue

describe('Variables spec', { tags: ['@dev7', '@xfail'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Variables')

    variableKey = generateUniqueName('KEY')
    variableValue = generateUniqueName('value')
  })

  it('should edit a variable', function () {
    // Creation Flow
    // Arrange
    cy.get(selectors.variables.createButton).click()

    // Act
    cy.get(selectors.variables.keyInput).type(variableKey)
    cy.get(selectors.variables.valueInput).type(variableValue)

    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.verifyToast('success', 'Your variable has been created')

    cy.get(selectors.form.actionsCancelButton).click()

    cy.get(selectors.list.searchInput).type(variableKey)
    cy.get(selectors.variables.listRow('key')).should('have.text', variableKey)

    // Edit Flow
    // Arrange
    cy.intercept('GET', '/api/v3/variables/*').as('variablesApi')

    cy.get(selectors.variables.listRow('key')).click()

    cy.wait('@variablesApi')

    // Act
    cy.get(selectors.variables.valueInput).clear()
    cy.get(selectors.variables.valueInput).type(variableValue)

    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.verifyToast('success', 'Your variable has been updated')

    cy.get(selectors.list.searchInput).type(variableKey)
    cy.get(selectors.variables.listRow('key')).should('have.text', variableKey)
  })

  afterEach(() => {
    // Delete the variable
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('Variable successfully deleted')
    })
  })
})
