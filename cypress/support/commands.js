/* eslint-disable no-undef */

// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

/**
 * Custom Cypress command to get an element by data-testid attribute.
 *
 * @param {string} selector - The value of the data-testid attribute to locate the element.
 * @param {...any} args - Additional arguments that can be passed to the cy.get() command.
 * @returns {Cypress.Chainable<JQuery<HTMLElement>>} - A Cypress Chainable yielding the found element.
 *
 * @example
 * cy.getByTestId('myTestId').should('be.visible');
 */
Cypress.Commands.add('getByTestId', (selector, ...args) => {
  return cy.get(`[data-testid="${selector}"]`, ...args)
})

function login(email, password, username) {
    // Arrange: Visit the login page and define user credentials
    cy.visit('/login');

    // Act: Enter email, password and click login button
    cy.get('#email').type(email)
    cy.get('.surface-card > :nth-child(2) > .p-button').click()
    cy.get('#password').type(password, { log: false })
    cy.get('.flex-row-reverse').click()

    // Assert: Verify successful login by checking for user's name in the profile menu
    cy.get('.gap-2 > .p-avatar').click()
    cy.get('.flex-column > .text-sm').should('contain', username)
}

Cypress.Commands.add('login', () => {
  const email = Cypress.env('CYPRESS_EMAIL_STAGE')
  const password = Cypress.env('CYPRESS_PASSWORD_STAGE')
  const username = Cypress.env('CYPRESS_USERNAME_STAGE')

  const log = Cypress.log({
    displayName: 'AUTH',
    message: [`🔐 Authenticating | ${email}`],
    autoEnd: false
  })
  log.snapshot('before')

  login(email, password, username)

  log.snapshot('after')
  log.end()
})
