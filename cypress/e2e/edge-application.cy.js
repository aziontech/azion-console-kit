import generateUniqueName from '../support/utils'

const selectors = {
  login: {
    emailInput: '[data-testid="signin-block__email-input"]',
    nextButton: '[data-testid="signin-block__next-button"] > .p-button-label',
    passwordInput: '[data-testid="signin-block__password-input"] > .p-inputtext',
    signInButton: '[data-testid="signin-block__signin-button"] > .p-button-label'
  },
  sidebar: {
    menuToggleButton: '[data-testid="sidebar-block__toggle-button"] > .p-button-icon',
    edgeApplicationMenuItem:
      '[data-testid="sidebar-block__menu-item__edge-application"] > .p-menuitem-text'
  },
  edgeApplication: {
    createButton: '.p-datatable-header > .flex-wrap > .p-button > .p-button-label',
    nameInput: '[data-testid="form-horizontal-general-name"]',
    addressInput: '[data-testid="form-horizontal-default-origin-address-field-text"]',
    saveButton: '[data-testid="form-actions-submit-button"]',
    cancelButton: '[data-testid="form-actions-cancel-button"]',
    searchInput: '[data-testid="data-table-search-input"]',
    tableRowName: '[data-testid="list-table-block__column__name__row"]',
    tableRowLastEditor: '[data-testid="list-table-block__column__lastEditor__row"]',
    rulesEngineTab: 'li:nth-child(6)',
    addRuleButton: '[data-testid="rules-engine-create-button"]',
    ruleNameInput: '[data-testid="rule-form-general-name"]',
    criteriaOperatorDropdown:
      '[data-testid="rule-form-criteria-item-conditional-operator"] > .p-dropdown-trigger',
    criteriaOperator: 'li[aria-label="is equal"]',
    criteriaInputValue: '[data-testid="rule-form-criteria-item-conditional-input-field-text"]',
    behaviorsDropdown: '[data-testid="rule-form-behaviors-item-name"] > .p-dropdown-trigger',
    behaviors: '#behaviors\\[0\\]\\.name_4',
    ruleTable: '.p-datatable-tbody > tr > :nth-child(2) > div',
    actionsButton: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
    deleteButton: '[data-testid="data-table-actions-column-body-actions-menu"]',
    deleteInput: '[data-testid="delete-dialog-confirmation-input-field"]',
    confirmDeleteButton: '[data-testid="delete-dialog-footer-delete-button"]'
  }
}

const edgeApplicationName = generateUniqueName('EdgeApp')
const rulesEngineName = generateUniqueName('RulesEng')

describe('Edge Application', () => {
  beforeEach(() => {
    // Login
    cy.login()
  })

  it('Create and delete an edge application, and create a rule', () => {
    // Navigate to Edge Applications
    cy.get(selectors.sidebar.menuToggleButton).click()
    cy.get(selectors.sidebar.edgeApplicationMenuItem).click()

    // Create an edge application
    cy.get(selectors.edgeApplication.createButton).click()
    cy.get(selectors.edgeApplication.nameInput).type(edgeApplicationName)
    cy.get(selectors.edgeApplication.addressInput).clear()
    cy.get(selectors.edgeApplication.addressInput).type('httpbingo.org')
    cy.get(selectors.edgeApplication.saveButton).click()
    cy.get(selectors.edgeApplication.cancelButton).click()

    // Verify the edge application was created
    cy.get(selectors.edgeApplication.searchInput).type(edgeApplicationName)
    cy.get(selectors.edgeApplication.tableRowName)
      .should('be.visible')
      .should('have.text', edgeApplicationName)

    // Navigate to Rules Engine Tab
    cy.get(selectors.edgeApplication.tableRowLastEditor).click()
    cy.get(selectors.edgeApplication.rulesEngineTab).click()

    // Create a rule
    cy.get(selectors.edgeApplication.addRuleButton).click()
    cy.get(selectors.edgeApplication.ruleNameInput).type(rulesEngineName)
    cy.get(selectors.edgeApplication.criteriaOperatorDropdown).click()
    cy.get(selectors.edgeApplication.criteriaOperator).click()
    cy.get(selectors.edgeApplication.criteriaInputValue).clear('/')
    cy.get(selectors.edgeApplication.criteriaInputValue).type('/')
    cy.get(selectors.edgeApplication.behaviorsDropdown).click()
    cy.get(selectors.edgeApplication.behaviors).click()
    cy.get(selectors.edgeApplication.saveButton).click()
    cy.get('.flex-column > .text-sm').should('be.visible')

    // Verify the rule was created
    cy.get(selectors.edgeApplication.searchInput).type(rulesEngineName)
    cy.get(selectors.edgeApplication.ruleTable)
      .should('be.visible')
      .should('have.text', rulesEngineName)

    // Delete the edge application
    cy.visit('/edge-applications')
    cy.get(selectors.edgeApplication.searchInput).clear()
    cy.get(selectors.edgeApplication.searchInput).type(edgeApplicationName)
    cy.get(selectors.edgeApplication.tableRowName)
      .should('be.visible')
      .should('have.text', edgeApplicationName)
    cy.get(selectors.edgeApplication.actionsButton).click()
    cy.get(selectors.edgeApplication.deleteButton).click()
    cy.get(selectors.edgeApplication.deleteInput).type('delete')
    cy.get(selectors.edgeApplication.confirmDeleteButton).click()
  })
})
