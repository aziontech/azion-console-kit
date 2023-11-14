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
  return cy.get(`[data-testid=${selector}]`, ...args)
})
