const selectors = {
  login: {
    emailInput: '[data-testid="signin-block__email-input"]',
    nextButton: '[data-testid="signin-block__next-button"] > .p-button-label',
    passwordInput: '[data-testid="signin-block__password-input"] > .p-inputtext',
    signInButton: '[data-testid="signin-block__signin-button"] > .p-button-label'
  },
  sidebar: {
    menuToggleButton: '[data-testid="sidebar-block__toggle-button"] > .p-button-icon',
    variablesMenuItem: '[data-testid="sidebar-block__menu-item__variables"] > .p-menuitem-text',
  },
  variables: {
    createButton: '[data-testid="create_Variable_button"]',
    keyInput: '#key',
    valueInput: '#value',
    saveButton: '[data-testid="form-actions-submit-button"]',
    cancelButton: '[data-testid="form-actions-cancel-button"]',
    searchInput: '[data-testid="data-table-search-input"]',
    tableRowKey: '[data-testid="list-table-block__column__key__row"]',
    actionsButton: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
    deleteButton: '[data-testid="data-table-actions-column-body-actions-menu"]',
    deleteInput: '[data-testid="delete-dialog-confirmation-input-field"]',
    confirmDeleteButton: '[data-testid="delete-dialog-footer-delete-button"]'
  }
}

const generateUniqueName = (prefix) => {
  const timestamp = Date.now()
  return `${prefix}${timestamp}`
}

const email = Cypress.env('CYPRESS_EMAIL_STAGE')
const password = Cypress.env('CYPRESS_PASSWORD_STAGE')
const keyName = generateUniqueName('KEY')
const valueName = generateUniqueName('Value')

describe('Variables spec', () => {
  beforeEach(() => {
    // Login
    cy.visit('/login')
    cy.get(selectors.login.emailInput).type(email)
    cy.get(selectors.login.nextButton).click()
    cy.get(selectors.login.passwordInput).type(password)
    cy.get(selectors.login.signInButton).click()

    // Navegar até a tela de Variáveis
    cy.get(selectors.sidebar.menuToggleButton).click();
    cy.get(selectors.sidebar.variablesMenuItem).click();
    cy.get('.text-\\[var\\(--text-color\\)\\]').should('be.visible').should('have.text', 'Variables');
  });

  it('Create a variable', () => {
    // Act
    cy.get(selectors.variables.createButton).click()
    cy.get(selectors.variables.keyInput).type(keyName)
    cy.get(selectors.variables.valueInput).type(valueName)
    cy.get(selectors.variables.saveButton).click()
    cy.get('.flex-column > .text-sm').should('be.visible')
    cy.get(selectors.variables.cancelButton).click()

    // Assert
    cy.get(selectors.variables.searchInput).click()
    cy.get(selectors.variables.searchInput).clear()
    cy.get(selectors.variables.searchInput).type(keyName)
    cy.get(selectors.variables.tableRowKey).should('be.visible').should('have.text', keyName)

    // Cleanup
    cy.get(selectors.variables.actionsButton).click();
    cy.get(selectors.variables.deleteButton).click();
    cy.get(selectors.variables.deleteInput).clear();
    cy.get(selectors.variables.deleteInput).type('delete');
    cy.get(selectors.variables.confirmDeleteButton).click();
    cy.get(selectors.variables.successMessage).should('have.text', 'Variable successfully deleted');
  });
});