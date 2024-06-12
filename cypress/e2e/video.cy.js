describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://example.cypress.io')
  })

  /* ==== Test Created with Cypress Studio ==== */
  it('video', function() {
    /* ==== Generated with Cypress Studio ==== */
    cy.visit('http://localhost:5173/login');
    cy.get('#email').clear();
    cy.get('#email').type('cypress_email_stage@zohomail.com');
    cy.get('.surface-card > :nth-child(2) > .p-button > .p-button-label').click();
    cy.get('#password > .p-inputtext').clear('A&93EREWU5mi');
    cy.get('#password > .p-inputtext').type('A&93EREWU5mi');
    cy.get('.flex-row-reverse > .p-button-label').click();
    cy.get('.sm\\:p-8.gap-6 > .flex > .text-color').should('be.visible');
    /* ==== End Cypress Studio ==== */
  });
})