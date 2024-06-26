/* eslint-disable no-undef */
/* eslint-disable no-console */

// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Disable test failure for all uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  console.log('Uncaught exception in test:', runnable.title);
  console.error('Uncaught exception:', err);
  return false;
});

// Custom command to get an element by data-testid
Cypress.Commands.add('getByTestId', (selector, ...args) => {
  return cy.get(`[data-testid="${selector}"]`, ...args)
})

// Helper function to perform login
function login(email, password, username) {
  cy.visit('/login');

  cy.get('#email').type(email);
  cy.get('.surface-card > :nth-child(2) > .p-button').click();
  cy.get('#password').type(password, { log: false });
  cy.get('.flex-row-reverse').click();

  cy.get('.gap-2 > .p-avatar').click();
  cy.get('.flex-column > .text-sm').should('contain', username);
}

// Custom command to perform login
Cypress.Commands.add('login', () => {
  const email = Cypress.env('CYPRESS_EMAIL_STAGE');
  const password = Cypress.env('CYPRESS_PASSWORD_STAGE');
  const username = Cypress.env('CYPRESS_USERNAME_STAGE');

  const log = Cypress.log({
    displayName: 'AUTH',
    message: [`🔐 Authenticating | ${email}`],
    autoEnd: false,
  });
  log.snapshot('before');

  login(email, password, username);

  log.snapshot('after');
  log.end();
});