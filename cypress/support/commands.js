/* eslint-disable no-undef */
/// <reference types="cypress" />
/// <reference types="../support" />
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

Cypress.Commands.add('getByTestId', (selector, ...args) => {
  return cy.get(`[data-testid=${selector}]`, ...args)
})

Cypress.Commands.add('getInput', (inputType, ...args) => {
  return cy.get(`input[type=${inputType}]`, ...args)
})

function loginWithEmail(email, password) {
  cy.session(
    ['login-with-email-session', email],
    () => {
      cy.visit('/login')
      cy.getByTestId('title').should('have.text', ' Azion Console ')
      cy.getInput('email').type(email)
      cy.getByTestId('next-button').click()
      cy.getInput('password').type(password, { log: false })
      cy.getByTestId('submit').click()
      cy.document().its('cookie').should('contain', 'ajs_user_id')
    },
    {
      cacheAcrossSpecs: true
    }
  )
}

Cypress.Commands.add('loginWithEmail', (email, password) => {
  const log = Cypress.log({
    displayName: 'AUTH',
    message: [`🔐 Authenticating | ${email}`],
    autoEnd: false
  })
  log.snapshot('before')

  loginWithEmail(email, password)

  log.snapshot('after')
  log.end()
})
