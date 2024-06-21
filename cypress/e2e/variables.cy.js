describe('Variables spec', () => {
  /* ==== Test Created with Cypress Studio ==== */
  it('Create a variable', function() {
    /* ==== Generated with Cypress Studio ==== */
    // cy.visit('https://stage-console.azion.com');
    // cy.get('[data-testid="signin-block__email-input"]').clear();
    // cy.get('[data-testid="signin-block__email-input"]').type('alisson.marcelo+stage2@azion.com{enter}');
    // cy.get('[data-testid="signin-block__password-input"] > .p-inputtext').clear();
    // cy.get('[data-testid="signin-block__password-input"] > .p-inputtext').type('LALALALA');
    // cy.get('[data-testid="signin-block__signin-button"] > .p-button-label').click();
    // cy.get('.sm\\:p-8 > .flex > .text-color').should('be.visible');
    /* ==== End Cypress Studio ==== */

    /* ==== Copied from login test ==== */
    const email = Cypress.env('CYPRESS_EMAIL_STAGE')
    const password = Cypress.env('CYPRESS_PASSWORD_STAGE')
    const username = Cypress.env('CYPRESS_USERNAME_STAGE')

    // Arrange: Visit the login page and define user credentials
    cy.visit('/');

    // Act: Enter email, password and click login button
    cy.get('#email').type(email)
    cy.get('.surface-card > :nth-child(2) > .p-button').click()
    cy.get('#password').type(password, { log: false })
    cy.get('.flex-row-reverse').click()

    // Assert: Verify successful login by checking for user's name in the profile menu
    cy.get('.gap-2 > .p-avatar').click()
    cy.get('.flex-column > .text-sm').should('contain', username)
    /* ==== End from login test ==== */

    /* ==== Generated with Cypress Studio ==== */
    cy.get('[data-testid="sidebar-block__toggle-button"]').click();
    cy.get('[data-testid="sidebar-block__menu-item__variables"] > .p-menuitem-text').should('be.visible');
    cy.get('[data-testid="sidebar-block__menu-item__variables"]').click();
    cy.get('.rounded-md > .gap-5 > .flex > .p-button > .p-button-icon').should('have.class', 'pi-plus');
    cy.get('.rounded-md > .gap-5 > .flex > .p-button > .p-button-label').click();
    cy.get('#key').clear('MY_VAR');
    cy.get('#key').type('MY_VAR');
    cy.get('#value').clear('my_var_value');
    cy.get('#value').type('my_var_value');
    cy.get('.max-md\\:w-full > .p-button-label').click();
    cy.get('.flex-column > .text-sm').should('be.visible');
    cy.get('.p-toast-icon-close > .p-icon').click();
    cy.get('.justify-content-end > .flex > .p-button-outlined > .p-button-label').click();
    cy.get('[data-testid="list-table-block__column__key__row"]').should('have.text', 'MY_VAR');
    cy.get('.whitespace-pre').should('have.text', 'my_var_value');
    cy.get('.p-frozen-column > .flex > .p-button > .p-button-icon').click();
    cy.get('.p-menuitem-content > .p-menuitem-link > .p-menuitem-text').click();
    cy.get('#confirm-input').clear();
    cy.get('#confirm-input').type('delete');
    cy.get('.p-button-danger > .p-button-label').click();
    cy.get('.justify-between > .flex > .text-color').should('have.text', 'Variable successfully deleted');
    /* ==== End Cypress Studio ==== */
  });
})