// https://on.cypress.io/api

describe('My First Test', () => {
  it('visits the app root url', () => {
    cy.visit('/login')
    cy.getByTestId('title').should('have.text', ' Real-Time Manager ')
  })
})
