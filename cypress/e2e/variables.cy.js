const selectors = {
  sidebar: {
    menuToggleButton: '[data-testid="sidebar-block__toggle-button"] > .p-button-icon',
    variablesMenuItem: '[data-testid="sidebar-block__menu-item__variables"] > .p-menuitem-text',
  },
  variables: {
    createButton: '[data-testid="create_Variable_button"]',
    keyInput: '#key',
    valueInput: '#value',
    saveButton: '[data-testid="Save_button"]',
    cancelButton: '[data-testid="Cancel_button"]',
    searchInput: '[data-testid="search_input"]',
    tableRowKey: '[data-testid="list-table-block__column__key__row"]',
    tableRowValue: '.whitespace-pre',
    actionsButton: '.p-frozen-column > .flex > .p-button > .p-button-icon',
    deleteButton: '.p-menuitem-content > .p-menuitem-link > .p-menuitem-text',
    deleteInput: '#confirm-input',
    confirmDeleteButton: '.p-button-danger > .p-button-label',
    successMessage: '.justify-between > .flex > .text-color',
    closeSuccessMessage: '.p-toast-icon-close > .p-icon'
  },
};

describe('Variables spec', () => {
  beforeEach(() => {
    // Login
    cy.login();

    // Navegar até a tela de Variáveis
    cy.get(selectors.sidebar.menuToggleButton).click();
    cy.get(selectors.sidebar.variablesMenuItem).click();
    cy.get('.text-\\[var\\(--text-color\\)\\]').should('be.visible').should('have.text', 'Variables');
  });

  it('Create a variable', () => {
    // Act
    cy.get(selectors.variables.createButton).click();
    cy.get(selectors.variables.keyInput).clear('MY_VAR');
    cy.get(selectors.variables.keyInput).type('MY_VAR');
    cy.get(selectors.variables.valueInput).clear('my_var_value');
    cy.get(selectors.variables.valueInput).type('my_var_value');
    cy.get(selectors.variables.saveButton).click();
    cy.get('.flex-column > .text-sm').should('be.visible');
    cy.get(selectors.variables.successMessage).should('have.text', 'success');
    cy.get(selectors.variables.closeSuccessMessage).click();
    cy.get(selectors.variables.cancelButton).click();

    // Assert
    cy.get(selectors.variables.searchInput).click();
    cy.get(selectors.variables.searchInput).clear();
    cy.get(selectors.variables.searchInput).type('MY_VAR{enter}');
    cy.get(selectors.variables.tableRowKey).should('be.visible').should('have.text', 'MY_VAR');
    cy.get(selectors.variables.tableRowValue).should('have.text', 'my_var_value');

    // Cleanup
    cy.get(selectors.variables.actionsButton).click();
    cy.get(selectors.variables.deleteButton).click();
    cy.get(selectors.variables.deleteInput).clear();
    cy.get(selectors.variables.deleteInput).type('delete');
    cy.get(selectors.variables.confirmDeleteButton).click();
    cy.get(selectors.variables.successMessage).should('have.text', 'Variable successfully deleted');
  });
});