import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let fixtures = {}

const createEdgeFirewallCase = () => {
  cy.get(selectors.edgeFirewall.createButton).click()
  cy.get(selectors.edgeFirewall.nameInput).clear()
  cy.get(selectors.edgeFirewall.nameInput).type(fixtures.edgeFirewallName)
  cy.get(selectors.edgeFirewall.edgeFunctionSwitch).click()
  cy.get(selectors.edgeFirewall.wafEnabledSwitch).click()
  cy.get(selectors.edgeFirewall.saveButton).click()
  cy.verifyToast('success', 'Your Edge Firewall has been created')
}

const createEdgeFirewallRulesEngineCase = (numberRule) => {
  cy.get(selectors.edgeFirewall.ruleNameInput).click()
  cy.get(selectors.edgeFirewall.ruleNameInput).type(`regra${numberRule}`)
  cy.get(selectors.edgeFirewall.ruleDescriptionInput).clear()
  cy.get(selectors.edgeFirewall.ruleDescriptionInput).type('My Rule Description')
  cy.get(selectors.edgeFirewall.ruleCriteriaVariableDropdown).click()
  cy.get(selectors.edgeFirewall.ruleCriteriaVariableDropdownRequestUri).click()
  cy.get(selectors.edgeFirewall.ruleCriteriaOperatorDropdown).click()
  cy.get(selectors.edgeFirewall.ruleCriteriaOperatorStartsWith).click()
  cy.get(selectors.edgeFirewall.ruleCriteriaInput).clear()
  cy.get(selectors.edgeFirewall.ruleCriteriaInput).type('/')
  cy.get(selectors.edgeFirewall.ruleBehaviorDropdown).click()
  cy.get(selectors.edgeFirewall.ruleBehaviorFirstOption).click()

  cy.get(selectors.edgeFirewall.ruleSubmit).click()
  cy.verifyToast('success', 'Rule Engine successfully created')
}

describe('Edge Firewall', { tags: ['@dev4'] }, () => {
  beforeEach(() => {
    fixtures.edgeFirewallName = generateUniqueName('EdgeFirewall')
    // Login
    cy.login()
  })

  it('should list a rule engine', () => {
    cy.openProduct('Edge Firewall')

    createEdgeFirewallCase()

    cy.get(selectors.edgeFirewall.rulesEngineTab).click()

    cy.get(selectors.edgeFirewall.createRuleButton).click()
    createEdgeFirewallRulesEngineCase('01')

    cy.get(selectors.edgeFirewall.createRulesEngine).click()
    createEdgeFirewallRulesEngineCase('02')

    cy.get(selectors.edgeFirewall.inputNumberFirstPosition).clear()
    cy.get(selectors.edgeFirewall.inputNumberFirstPosition).type('1{enter}')
    cy.get(selectors.edgeFirewall.reviewChanges).should('be.visible')
    cy.get(selectors.edgeFirewall.reviewChanges).click()
    cy.get(selectors.edgeFirewall.reviewChangesModal).should('have.text', ' Rule ”regra01” reordered from 0 to 1. ')
    cy.get(selectors.edgeFirewall.saveReorder).click()
    cy.verifyToast('success', 'Reorder saved')
  })

  afterEach(() => {
    cy.deleteEntityFromList({ entityName: fixtures.edgeFirewallName, productName: 'Edge Firewall' }).then(() => {
      cy.verifyToast('Edge Firewall successfully deleted')
    })
  })
})
