describe('Variables spec', () => {
  it('Create a variable', function() {
    // Arrange
    cy.login();
    cy.get('[data-testid="sidebar-block__toggle-button"] > .p-button-icon').click();
    cy.get('[data-testid="sidebar-block__menu-item__variables"] > .p-menuitem-text').should('have.class', 'p-menuitem-text').should('have.text', 'Variables').click();
    cy.get('.text-\\[var\\(--text-color\\)\\]').should('be.visible').should('have.text', 'Variables');

    // Act
    cy.getByTestId('create_Variable_button').click();
    cy.get('#key').clear('MY_VAR');
    cy.get('#key').type('MY_VAR');
    cy.get('#value').clear('my_var_value');
    cy.get('#value').type('my_var_value');
    cy.getByTestId('Save_button').click();
    cy.get('.flex-column > .text-sm').should('be.visible');
    cy.get('.justify-between > .flex > .text-color').should('have.text', 'success');
    cy.get('.p-toast-icon-close > .p-icon').should('have.class', 'p-toast-icon-close-icon').click();
    cy.getByTestId('Cancel_button').click();
    cy.getByTestId('search_input').click();
    cy.get('[data-testid="search_input"]').clear();

    // Assert
    cy.get('[data-testid="search_input"]').type('MY_VAR{enter}');
    cy.get('[data-testid="list-table-block__column__key__row"]').should('be.visible').should('have.text', 'MY_VAR');
    cy.get('.whitespace-pre').should('have.text', 'my_var_value');

    // Cleanup
    cy.get('.p-frozen-column > .flex > .p-button > .p-button-icon').click();
    cy.get('.p-menuitem-content > .p-menuitem-link > .p-menuitem-text').click();
    cy.get('#confirm-input').clear();
    cy.get('#confirm-input').type('delete');
    cy.get('.p-button-danger > .p-button-label').click();
    cy.get('.justify-between > .flex > .text-color').should('have.text', 'Variable successfully deleted');
  });
})
