/* eslint-disable cypress/no-unnecessary-waiting */
import generateUniqueName from '../support/utils'
import selectors from '../support/selectors'

let firewallName, functionInstanceName, ruleName, networkListName, wafName

const createASNNetworkListCase = () => {
  cy.openProduct('Network Lists')

  // Act
  cy.get(selectors.networkLists.createButton).click()

  cy.get(selectors.networkLists.nameInput).clear()
  cy.get(selectors.networkLists.nameInput).type(networkListName)

  cy.get(selectors.networkLists.typeDropdown).click()
  cy.get(selectors.networkLists.typeDropdown).find('li').eq(0).should('have.text', 'ASN').click()

  cy.get(selectors.networkLists.asnTextarea).click()
  cy.get(selectors.networkLists.asnTextarea).type('9876{enter}6789{enter}')

  cy.get(selectors.networkLists.saveButton).click()
  cy.verifyToast('success', 'Your network list has been created')
}

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
    functionInstanceName = generateUniqueName('EdgeFirewallFunctionInstance')
    ruleName = generateUniqueName('EdgeFirewallRule')
    wafName = generateUniqueName('WAF')
    networkListName = generateUniqueName('NetworkList')
  })
  afterEach(() => {
    // Delete the firewall
    cy.deleteEntityFromList({ entityName: firewallName, productName: 'Edge Firewall' }).then(() => {
      cy.verifyToast('Edge Firewall successfully deleted')
    })
  })

  it('should create an Edge Firewall ', () => {
    cy.openProduct('Edge Firewall')

    // Act
    cy.get(selectors.edgeFirewall.createButton).click()
    cy.get(selectors.edgeFirewall.nameInput).clear()
    cy.get(selectors.edgeFirewall.nameInput).type(firewallName)
    cy.get(selectors.edgeFirewall.saveButton).click()
    cy.verifyToast('success', 'Your Edge Firewall has been created')
    cy.get(selectors.edgeFirewall.cancelButton).click()

    // Assert
    cy.get(selectors.edgeFirewall.searchInput).clear()
    cy.get(selectors.edgeFirewall.searchInput).type(firewallName)
    cy.get(selectors.edgeFirewall.nameRow).should('have.text', firewallName)
    cy.get(selectors.edgeFirewall.activeRow).should('have.text', 'Active')
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
    cy.get(selectors.edgeFirewall.createFunctionInstanceButton).click()
    cy.get(selectors.edgeFirewall.functionInstanceName).clear()
    cy.get(selectors.edgeFirewall.functionInstanceName).type(functionInstanceName)
    cy.get(selectors.edgeFirewall.functionInstanceDropdown).click()
    cy.get(selectors.edgeFirewall.functionInstancDropdownFilter).clear()
    cy.get(selectors.edgeFirewall.functionInstancDropdownFilter).type(
      'Edge Firewall Test Function - NAO DELETAR{enter}'
    )
    cy.get(selectors.edgeFirewall.functionInstanceDropdown).click()
    cy.get(selectors.edgeFirewall.functionInstanceDropdownFunction).click()
    cy.get(selectors.edgeFirewall.functionInstanceSubmit).click()
    cy.verifyToast('success', 'Your Function has been created')

    // Assert - Find created function
    cy.get(selectors.edgeFirewall.functionInstanceTableSearchInput).clear()
    cy.get(selectors.edgeFirewall.functionInstanceTableSearchInput).type(functionInstanceName)
    cy.get(selectors.edgeFirewall.functionInstanceTableColumnName).should(
      'have.text',
      functionInstanceName
    )
    cy.get(selectors.edgeFirewall.functionInstanceTableColumnInstanced).should(
      'have.text',
      'Edge Firewall Test Function - NAO DELETAR'
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

    // Cleanup - Remove the created function instance
    cy.get(selectors.edgeFirewall.functionsTab).click()
    cy.get(selectors.edgeFirewall.functionInstanceTableSearchInput).clear()
    cy.get(selectors.edgeFirewall.functionInstanceTableSearchInput).type(functionInstanceName)
    cy.deleteEntityFromLoadedList().then(() => {
      cy.verifyToast('Function successfully deleted')
    })

    // Assert - Find the created firewall
    cy.get(selectors.edgeFirewall.mainSettingsTab).click()
    cy.get(selectors.edgeFirewall.cancelButton).click()
    cy.get(selectors.edgeFirewall.searchInput).clear()
    cy.get(selectors.edgeFirewall.searchInput).type(firewallName)
    cy.get(selectors.edgeFirewall.nameRow).should('have.text', firewallName)
    cy.get(selectors.edgeFirewall.activeRow).should('have.text', 'Active')
  })

  it('should create an Edge Firewall with a rules engine using a Network List', () => {
    createASNNetworkListCase()
    cy.openProduct('Edge Firewall')

    // Act - create Edge Firewall
    cy.get(selectors.edgeFirewall.createButton).click()
    cy.get(selectors.edgeFirewall.nameInput).clear()
    cy.get(selectors.edgeFirewall.nameInput).type(firewallName)
    cy.get(selectors.edgeFirewall.saveButton).click()
    cy.verifyToast('success', 'Your Edge Firewall has been created')

    // Act - Create a rule with a network list
    cy.get(selectors.edgeFirewall.rulesEngineTab).click()
    cy.get(selectors.edgeFirewall.createRuleButton).click()
    cy.get(selectors.edgeFirewall.ruleNameInput).click()
    cy.get(selectors.edgeFirewall.ruleNameInput).type(ruleName)
    cy.get(selectors.edgeFirewall.ruleDescriptionInput).clear()
    cy.get(selectors.edgeFirewall.ruleDescriptionInput).type('My Rule Description')

    // Act - Set Criteria
    cy.get(selectors.edgeFirewall.ruleCriteriaVariableDropdown).click()
    cy.get(selectors.edgeFirewall.ruleCriteriaVariableDropdownNetworkLists).click()
    cy.get(selectors.edgeFirewall.ruleCriteriaOperatorDropdown).click()
    cy.get(selectors.edgeFirewall.ruleCriteriaOperatorFirstOption).click()
    cy.wait(1000)
    cy.get(selectors.edgeFirewall.ruleCriteriaNetworkListDropdown).click()
    cy.get(selectors.edgeFirewall.ruleCriteriaNetworkListFilter).clear()
    cy.get(selectors.edgeFirewall.ruleCriteriaNetworkListFilter).type(networkListName)
    cy.get(selectors.edgeFirewall.ruleCriteriaNetworkListDropdown).click()
    cy.get(selectors.edgeFirewall.ruleCriteriaValueFirstOption).click()

    // Act - Set Behavior
    cy.get(selectors.edgeFirewall.behaviorsDropdown).click()
    cy.get(selectors.edgeFirewall.ruleBehaviorFirstOption).click()
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
})
