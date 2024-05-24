describe('Login Test', () => {
  it('should successfully log in to the Azion Console', () => {
    const email = Cypress.env('EMAIL_STAGE');
    const password = Cypress.env('PASSWORD_STAGE');
    const username = Cypress.env('USERNAME_STAGE');

    // Arrange: Visit the login page and define user credentials
    cy.visit('/login');

    // Act: Enter email, password and click login button
    cy.get('#email').type(email);
    cy.get('.surface-card > :nth-child(2) > .p-button').click();
    cy.get('#password').type(password);
    cy.get('.flex-row-reverse').click();

    // Assert: Verify successful login by checking for user's name in the profile menu
    cy.get('.gap-2 > .p-avatar').click();
    cy.get('.flex-column > .text-sm').should('contain', username);
  });
});
