/// <reference types="Cypress" />

describe('Create and Edge application journey', () => {
  beforeEach(() => {
    cy.loginWithEmail(Cypress.env('username'), Cypress.env('password'))
  })

  it('Should be able to click on create', () => {
    // cy.loginWithEmail(Cypress.env('username'), Cypress.env('password'))

    cy.visit('/')
    cy.getByTestId('create-button').click()
    cy.contains(/import from github/i)
  })

  it('Should be able to click on create 2', () => {
    // cy.loginWithEmail(Cypress.env('username'), Cypress.env('password'))

    cy.visit('/')
    cy.getByTestId('create-button').click()
    cy.contains(/create/i)
  })
})
