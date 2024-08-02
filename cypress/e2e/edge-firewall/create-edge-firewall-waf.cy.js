/* eslint-disable cypress/no-unnecessary-waiting */
import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let firewallName, ruleName, wafName

const createWAFCase = () => {
  cy.openProduct('WAF Rules')

  // Arrange
  cy.get(selectors.wafs.createButton).click()
  cy.get(selectors.wafs.nameInput).clear()

  // Act
  cy.get(selectors.wafs.nameInput).type(wafName)
  cy.get(selectors.form.actionsSubmitButton).click()
  cy.verifyToast('success', 'Your waf rule has been created')
}

describe('Edge Firewall spec', { tags: ['@dev'] }, () => {
  beforeEach(() => {
    cy.login()
    firewallName = generateUniqueName('EdgeFirewall')
    ruleName = generateUniqueName('EdgeFirewallRule')
    wafName = generateUniqueName('WAF')
  })

  it('should create an Edge Firewall with a rules engine using a WAF', () => {
    createWAFCase()
    cy.wait(2000)
    cy.openProduct('Edge Firewall')

    // Act - create Edge Firewall
    cy.get(selectors.edgeFirewall.createButton).click()
    cy.get(selectors.edgeFirewall.nameInput).clear()
    cy.get(selectors.edgeFirewall.nameInput).type(firewallName)
    cy.get(selectors.edgeFirewall.wafEnabledSwitch).click()
    cy.get(selectors.edgeFirewall.saveButton).click()
    cy.verifyToast('success', 'Your Edge Firewall has been created')

    // Act - Create a rule with WAF
    cy.get(selectors.edgeFirewall.rulesEngineTab).click()
    cy.get(selectors.edgeFirewall.createRuleButton).click()
    cy.get(selectors.edgeFirewall.ruleNameInput).click()
    cy.get(selectors.edgeFirewall.ruleNameInput).type(ruleName)
    cy.get(selectors.edgeFirewall.ruleDescriptionInput).clear()
    cy.get(selectors.edgeFirewall.ruleDescriptionInput).type('My Rule Description')

    // Act - Set Criteria
    cy.get(selectors.edgeFirewall.ruleCriteriaVariableDropdown).click()
    cy.get(selectors.edgeFirewall.ruleCriteriaVariableDropdownRequestUri).click()
    cy.get(selectors.edgeFirewall.ruleCriteriaOperatorDropdown).click()
    cy.get(selectors.edgeFirewall.ruleCriteriaOperatorStartsWith).click()
    cy.get(selectors.edgeFirewall.ruleCriteriaInput).clear()
    cy.get(selectors.edgeFirewall.ruleCriteriaInput).type('/')

    // Act - Set WAF Behavior
    cy.get(selectors.edgeFirewall.ruleBehaviorDropdown).click()
    cy.get(selectors.edgeFirewall.behaviorsWafOption).click()
    cy.get(selectors.edgeFirewall.rulesWafDropdown).click()
    cy.get(selectors.edgeFirewall.rulesWafDropdownFilter).clear()
    cy.get(selectors.edgeFirewall.rulesWafDropdownFilter).type(wafName)
    cy.get(selectors.edgeFirewall.rulesWafFirstOption).click()
    cy.get(selectors.edgeFirewall.rulesWafModeDropdown).click()
    cy.get(selectors.edgeFirewall.rulesWafFirstModeOption).click()
    cy.get(selectors.edgeFirewall.ruleSubmit).click()
    cy.verifyToast('success', 'Rule Engine successfully created')

    // Assert - Find the created rule
    cy.get(selectors.edgeFirewall.rulesTableSearchInput).clear()
    cy.get(selectors.edgeFirewall.rulesTableSearchInput).type(ruleName)
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

    // Assert - Find the created firewall
    cy.get(selectors.edgeFirewall.mainSettingsTab).click()
    cy.get(selectors.edgeFirewall.cancelButton).click()
    cy.get(selectors.edgeFirewall.searchInput).clear()
    cy.get(selectors.edgeFirewall.searchInput).type(firewallName)
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