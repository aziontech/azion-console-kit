import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let variableKey
let variableValue

describe('Variables spec', { tags: ['@dev2'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Variables')

    variableKey = generateUniqueName('KEY')
    variableValue = generateUniqueName('value')
  })

  it('should create a secret', function () {
    const secretValue = '********'
    // Arrange
    cy.get(selectors.variables.createButton).click()

    // Act
    cy.get(selectors.variables.keyInput).type(variableKey)
    cy.get(selectors.variables.valueInput).type(variableValue)
    cy.get(selectors.variables.secretToggle).click()
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your variable has been created')

    // Assert
    cy.get(selectors.list.searchInput).type(variableKey)
    cy.get(selectors.variables.listRow('key')).should('have.text', variableKey)
    cy.get(selectors.variables.listRow('value')).should('have.text', secretValue)
    cy.get(selectors.variables.listRow('value')).find('button').should('not.exist')
  })

  afterEach(() => {
    // Delete the variable
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('Variable successfully deleted')
    })
  })
})
