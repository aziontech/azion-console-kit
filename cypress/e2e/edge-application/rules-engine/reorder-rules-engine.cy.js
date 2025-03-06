import generateUniqueName from '../../../support/utils'
import selectors from '../../../support/selectors'

let fixtures = {}

const createEdgeApplicationCase = () => {
  // Act
  cy.get(selectors.edgeApplication.mainSettings.createButton).click()
  cy.get(selectors.edgeApplication.mainSettings.nameInput).type(fixtures.edgeApplicationName)
  cy.get(selectors.edgeApplication.mainSettings.addressInput).clear()
  cy.get(selectors.edgeApplication.mainSettings.addressInput).type('httpbingo.org')
  cy.get(selectors.form.actionsSubmitButton).click()
  cy.verifyToast('success', 'Your edge application has been created')
  cy.get(selectors.form.actionsCancelButton).click()

  // Assert - Verify the edge application was created
  cy.get(selectors.list.searchInput).type(`${fixtures.edgeApplicationName}{enter}`)
  cy.get(selectors.list.filteredRow.column('name')).should(
    'have.text',
    fixtures.edgeApplicationName
  )

  // Act - Navigate to the created edge application
  cy.get(selectors.list.filteredRow.column('name')).click()
}

describe('Edge Application', { tags: ['@dev4'] }, () => {
  beforeEach(() => {
    fixtures.edgeApplicationName = generateUniqueName('EdgeApp')
    // Login
    cy.login()
  })

  it('should list a rule engine', () => {
    cy.openProduct('Edge Application')

    createEdgeApplicationCase()

    cy.get(selectors.edgeApplication.rulesEngine.clickOnTabRulesEngine).click()
    cy.get(selectors.edgeApplication.rulesEngine.checkDefaultRulesEngine).should(
      'have.text',
      'Default Rule'
    )

    cy.get(selectors.edgeApplication.rulesEngine.createButton).click()

    cy.get(selectors.edgeApplication.rulesEngine.ruleNameInput).clear()
    cy.get(selectors.edgeApplication.rulesEngine.ruleNameInput).type('regra01')
    cy.get(selectors.edgeApplication.rulesEngine.criteriaInputValue(0, 0)).clear()
    cy.get(selectors.edgeApplication.rulesEngine.criteriaInputValue(0, 0)).type('/')
    cy.get(selectors.edgeApplication.rulesEngine.saveButton).click()

    cy.get(selectors.edgeApplication.rulesEngine.createButton).click()
    cy.get(selectors.edgeApplication.rulesEngine.ruleNameInput).clear()
    cy.get(selectors.edgeApplication.rulesEngine.ruleNameInput).type('regra02')
    cy.get(selectors.edgeApplication.rulesEngine.criteriaInputValue(0, 0)).clear('/')
    cy.get(selectors.edgeApplication.rulesEngine.criteriaInputValue(0, 0)).type('/')
    cy.get(selectors.edgeApplication.rulesEngine.saveButton).click()

    cy.get(selectors.edgeApplication.rulesEngine.inputNumberFirstPosition).clear()
    cy.get(selectors.edgeApplication.rulesEngine.inputNumberFirstPosition).type('2{enter}')

    cy.get(selectors.edgeApplication.rulesEngine.reviewChanges).should('be.visible')
    cy.get(selectors.edgeApplication.rulesEngine.reviewChanges).click()

    cy.get(selectors.edgeApplication.rulesEngine.reviewChangesModal).should(
      'have.text',
      ' Rule ”regra01” reordered from 1 to 2. '
    )
    cy.get(selectors.edgeApplication.rulesEngine.saveReorder).click()
    cy.verifyToast('success', 'Reorder saved')
  })
})
