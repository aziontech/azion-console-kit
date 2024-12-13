/* eslint-disable cypress/no-unnecessary-waiting */
import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let firewallName, functionInstanceName, ruleName, functionName

const createFunctionCase = () => {
  // Act
  cy.get(selectors.functions.nameInput).clear()
  cy.get(selectors.functions.nameInput).type(functionName, { delay: 0 })
  cy.intercept('GET', '/api/v4/edge_functions/functions/*').as('getFunctionsSaved')
  cy.get(selectors.edgeFirewall.edgeFunctionActionbar).find(selectors.functions.saveButton).click()
  cy.verifyToast('success', 'Your edge function has been created')
  cy.wait('@getFunctionsSaved')
}
//Flag xfail until the api contract is updated on prod
describe('Edge Firewall spec', { tags: ['@dev5, @xfail'] }, () => {
  beforeEach(() => {
    cy.login()
    firewallName = generateUniqueName('EdgeFirewall')
    functionInstanceName = generateUniqueName('EdgeFirewallFunctionInstance')
    ruleName = generateUniqueName('EdgeFirewallRule')
    functionName = generateUniqueName('EdgeFirewallFunction')
  })

  it('should create an Edge Firewall and run a function', () => {
    cy.openProduct('Edge Firewall')

    // Act - create Edge Firewall
    cy.get(selectors.edgeFirewall.createButton).click()
    cy.get(selectors.edgeFirewall.nameInput).clear()
    cy.get(selectors.edgeFirewall.nameInput).type(firewallName)
    cy.get(selectors.edgeFirewall.edgeFunctionSwitch).click()
    cy.get(selectors.edgeFirewall.wafEnabledSwitch).click()
    cy.get(selectors.edgeFirewall.saveButton).click()
    cy.verifyToast('success', 'Your Edge Firewall has been created')

    // Act - create Edge Function instance
    cy.get(selectors.edgeFirewall.functionsTab).click()
    cy.intercept('GET', '/api/v4/edge_functions/functions*').as('getFunctions')
    cy.get(selectors.edgeFirewall.createFunctionInstanceButton).click()
    cy.get(selectors.edgeFirewall.functionInstanceName).clear()
    cy.get(selectors.edgeFirewall.functionInstanceName).type(functionInstanceName)
    cy.wait('@getFunctions')
    cy.get(selectors.edgeFirewall.functionInstanceDropdown).click()
    cy.get(selectors.edgeFirewall.createFunctionButton).click()
    createFunctionCase()
    cy.get(selectors.edgeFirewall.functionInstanceSubmit).click()
    cy.verifyToast('success', 'Your Function has been created')

    // Assert - Find created function
    cy.get(selectors.edgeFirewall.functionInstanceTableSearchInput).clear()
    cy.get(selectors.edgeFirewall.functionInstanceTableSearchInput).type(
      `${functionInstanceName}{enter}`
    )
    cy.get(selectors.edgeFirewall.functionInstanceTableColumnName).should(
      'have.text',
      functionInstanceName
    )

    // Act - Create a rule do run the function
    cy.get(selectors.edgeFirewall.rulesEngineTab).click()
    cy.get(selectors.edgeFirewall.createRuleButton).click()
    cy.get(selectors.edgeFirewall.ruleNameInput).click()
    cy.get(selectors.edgeFirewall.ruleNameInput).type(ruleName)
    cy.get(selectors.edgeFirewall.ruleDescriptionInput).clear()
    cy.get(selectors.edgeFirewall.ruleDescriptionInput).type('My Rule Description')
    cy.get(selectors.edgeFirewall.ruleCriteriaVariableDropdown).click()
    cy.get(selectors.edgeFirewall.ruleCriteriaVariableDropdownRequestUri).click()
    cy.get(selectors.edgeFirewall.ruleCriteriaOperatorDropdown).click()
    cy.get(selectors.edgeFirewall.ruleCriteriaOperatorStartsWith).click()
    cy.get(selectors.edgeFirewall.ruleCriteriaInput).clear()
    cy.get(selectors.edgeFirewall.ruleCriteriaInput).type('/')
    cy.get(selectors.edgeFirewall.ruleBehaviorDropdown).click()
    cy.get(selectors.edgeFirewall.ruleBehaviorRunFunction).click()
    cy.get(selectors.edgeFirewall.ruleBehaviorFunctionToRunDropdown).click()
    cy.get(selectors.edgeFirewall.ruleBehaviorFunctionToRun).click()
    cy.get(selectors.edgeFirewall.ruleSubmit).click()
    cy.verifyToast('success', 'Rule Engine successfully created')

    // Assert - Find the created rule
    cy.get(selectors.edgeFirewall.rulesTableSearchInput).clear()
    cy.get(selectors.edgeFirewall.rulesTableSearchInput).type(`${ruleName}{enter}`)
    cy.get(selectors.edgeFirewall.rulesTableColumnName).should('have.text', ruleName)
    cy.get(selectors.edgeFirewall.rulesTableColumnDescriptionShowMore).click()
    cy.get(selectors.edgeFirewall.rulesTableColumnDescription).should(
      'have.text',
      'My Rule Description'
    )

    // Cleanup - Remove the created rule
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('Rules Engine successfully deleted')
    })

    // Cleanup - Remove the created function instance
    cy.get(selectors.edgeFirewall.functionsTab).click()
    cy.get(selectors.edgeFirewall.functionInstanceTableSearchInput).clear()
    cy.get(selectors.edgeFirewall.functionInstanceTableSearchInput).type(
      `${functionInstanceName}{enter}`
    )
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('Function successfully deleted')
    })

    // Assert - Find the created firewall
    cy.get(selectors.edgeFirewall.mainSettingsTab).click()
    cy.get(selectors.edgeFirewall.cancelButton).click()
    cy.get(selectors.edgeFirewall.searchInput).clear()
    cy.get(selectors.edgeFirewall.searchInput).type(`${firewallName}{enter}`)
    cy.get(selectors.edgeFirewall.nameRow).should('have.text', firewallName)
    cy.get(selectors.edgeFirewall.activeRow).should('have.text', 'Active')
  })

  afterEach(() => {
    // Delete the firewall
    cy.deleteEntityFromList({ entityName: firewallName, productName: 'Edge Firewall' }).then(() => {
      cy.verifyToast('Edge Firewall successfully deleted')
    })
  })
})
