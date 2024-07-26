import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let variableKey
let variableValue

describe('Variables spec', () => {
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
    cy.get(selectors.form.actionsCancelButton).click()

    // Assert
    cy.get(selectors.list.searchInput).type(variableKey)
    cy.get(selectors.variables.listRow('key')).should('have.text', variableKey)
  })

  it('should edit a variable', function () {
    // Creation Flow
    // Arrange
    const secretValue = '********'
    cy.get(selectors.variables.createButton).click()

    // Act
    cy.get(selectors.variables.keyInput).type(variableKey)
    cy.get(selectors.variables.valueInput).type(variableValue)
    cy.get(selectors.variables.secretToggle).click()

    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.verifyToast('success', 'Your variable has been created')

    cy.get(selectors.variables.valueInput).should('have.value', secretValue)
    cy.get(selectors.form.actionsCancelButton).click()

    cy.get(selectors.list.searchInput).type(variableKey)
    cy.get(selectors.variables.listRow('key')).should('have.text', variableKey)
    cy.get(selectors.variables.listRow('value')).should('have.text', secretValue)

    // Edit Flow
    // Arrange
    cy.intercept('GET', '/api/v3/variables/*').as('variablesApi')

    cy.get(selectors.variables.listRow('key')).click()

    cy.wait('@variablesApi')
    cy.get(selectors.variables.secretToggle).click()

    // Act
    cy.get(selectors.variables.valueInput).clear()
    cy.get(selectors.variables.valueInput).type(variableValue)

    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.verifyToast('success', 'Your variable has been updated')

    cy.get(selectors.list.searchInput).type(variableKey)
    cy.get(selectors.variables.listRow('key')).should('have.text', variableKey)
    cy.get(selectors.variables.showMore).click()
    cy.get(selectors.variables.listRow('value')).should('contain.text', variableValue)
  })

  afterEach(() => {
    // Delete the variable
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('Variable successfully deleted')
    })
  })
})
