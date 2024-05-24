describe('Login Test', () => {
  it('should successfully log in to the Azion Console', () => {
    const email = process.env('CYPRESS_EMAIL_STAGE');
    const password = process.env('CYPRESS_PASSWORD_STAGE');
    const username = process.env('CYPRESS_USERNAME_STAGE');
    if (email)
      console.log("defined");
    console.log(email);

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
