import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

let functionName = ''

describe('Edge Functions spec', { tags: ['@dev'] }, () => {
  beforeEach(() => {
    cy.login()
    functionName = generateUniqueName('Function')
    cy.openProduct('Edge Functions')
  })
  afterEach(() => {
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('Edge function successfully deleted')
    })
  })

  it('Create a function', function () {
    // Act
    cy.get(selectors.functions.createButton).click()
    cy.get(selectors.functions.nameInput).clear()
    cy.get(selectors.functions.nameInput).type(functionName, { delay: 0 })
    cy.get(selectors.functions.saveButton).click()
    cy.verifyToast('success', 'Your edge function has been created')
    cy.get(selectors.functions.cancelButton).click()

    // Assert
    cy.get(selectors.functions.searchInput).clear()
    cy.get(selectors.functions.searchInput).type(functionName, { delay: 0 })
    cy.get(selectors.functions.nameRow).should('have.text', functionName)
    cy.get(selectors.functions.languageRow).should('have.text', 'JavaScript')
    cy.get(selectors.functions.initiatorTypeRow).should('have.text', 'edge_application')
  })
})
