/* eslint-disable cypress/no-unnecessary-waiting */
import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let firewallName, ruleName, edgeFirewallName

describe('Edge Firewall spec', { tags: ['@dev5'] }, () => {
  beforeEach(() => {
    cy.login()
    firewallName = generateUniqueName('EdgeFirewall')
    edgeFirewallName = generateUniqueName('EdgeFirewall')
    ruleName = generateUniqueName('EdgeFirewallRule')
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
    cy.verifyToastWithAction('success', 'Your Edge Firewall has been created')

    cy.get(selectors.edgeFirewall.rulesEngineTab).click()
    cy.get(selectors.edgeFirewall.createRuleButton).click()
    cy.get(selectors.edgeFirewall.ruleNameInput).click()
    cy.get(selectors.edgeFirewall.ruleNameInput).type(ruleName)
    cy.get(selectors.edgeFirewall.ruleDescriptionInput).clear()
    cy.get(selectors.edgeFirewall.ruleDescriptionInput).type('My Rule Description')
    cy.get(selectors.edgeFirewall.ruleCriteriaVariableDropdown).click()
    cy.get(selectors.edgeFirewall.ruleCriteriaVariableDropdownHeaderAccept).click()
    cy.get(selectors.edgeFirewall.ruleCriteriaOperatorDropdown).click()
    cy.get(selectors.edgeFirewall.ruleCriteriaOperatorMatches).click()
    cy.get(selectors.edgeFirewall.ruleCriteriaInput).clear()
    cy.get(selectors.edgeFirewall.ruleCriteriaInput).type('test')
    cy.get(selectors.edgeFirewall.ruleBehaviorDropdown).click()
    cy.get(selectors.edgeFirewall.ruleBehaviorFirstOption).click()

    cy.intercept('POST', '/v4/workspace/firewalls/*/rules*').as('addEdgeFirewallRule')

    cy.get(selectors.edgeFirewall.ruleSubmit).click()

    cy.wait('@addEdgeFirewallRule').then((interception) => {
      const requestBody = interception.request.body
      expect(requestBody.criteria[0][0].operator).to.equal('matches')
    })

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
  })

  it('should create an Edge Firewall and Tag Event', () => {
    cy.openProduct('Edge Firewall')

    // Act - create Edge Firewall
    cy.get(selectors.edgeFirewall.createButton).click()
    cy.get(selectors.edgeFirewall.nameInput).clear()
    cy.get(selectors.edgeFirewall.nameInput).type(edgeFirewallName)
    cy.get(selectors.edgeFirewall.edgeFunctionSwitch).click()
    cy.get(selectors.edgeFirewall.wafEnabledSwitch).click()
    cy.get(selectors.edgeFirewall.saveButton).click()
    cy.verifyToastWithAction('success', 'Your Edge Firewall has been created')

    cy.get(selectors.edgeFirewall.rulesEngineTab).click()
    cy.get(selectors.edgeFirewall.createRuleButton).click()
    cy.get(selectors.edgeFirewall.ruleNameInput).click()
    cy.get(selectors.edgeFirewall.ruleNameInput).type(ruleName)
    cy.get(selectors.edgeFirewall.ruleDescriptionInput).clear()
    cy.get(selectors.edgeFirewall.ruleDescriptionInput).type('My Rule Description')
    cy.get(selectors.edgeFirewall.ruleCriteriaVariableDropdown).click()
    cy.get(selectors.edgeFirewall.ruleCriteriaVariableDropdownHeaderAccept).click()
    cy.get(selectors.edgeFirewall.ruleCriteriaOperatorDropdown).click()
    cy.get(selectors.edgeFirewall.ruleCriteriaOperatorMatches).click()
    cy.get(selectors.edgeFirewall.ruleCriteriaInput).clear()
    cy.get(selectors.edgeFirewall.ruleCriteriaInput).type('test')
    cy.get(selectors.edgeFirewall.ruleBehaviorDropdown).click()
    cy.get(selectors.edgeFirewall.ruleBehaviorTagEventOption).click()
    cy.get(selectors.edgeFirewall.behaviorTagEventOption).type('Tag_Name')

    cy.intercept('POST', '/v4/workspace/firewalls/*/rules*').as('addEdgeFirewallRule')

    cy.get(selectors.edgeFirewall.ruleSubmit).click()

    cy.wait('@addEdgeFirewallRule').then((interception) => {
      const requestBody = interception.request.body
      expect(requestBody.criteria[0][0].operator).to.equal('matches')
    })

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

    // Assert - Find the created firewall
    cy.get(selectors.edgeFirewall.mainSettingsTab).click()
    cy.get(selectors.edgeFirewall.cancelButton).click()
    cy.get(selectors.edgeFirewall.searchInput).clear()
    cy.get(selectors.edgeFirewall.searchInput).type(`${edgeFirewallName}{enter}`)
    cy.get(selectors.edgeFirewall.nameRow).should('have.text', edgeFirewallName)
    cy.get(selectors.edgeFirewall.activeRow).should('have.text', 'Active')
  })
})
