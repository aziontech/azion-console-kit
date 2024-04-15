/// <reference types="cypress" />

// https://docs.cypress.io/guides/tooling/IDE-integration#Intelligent-Code-Completion
declare namespace Cypress {
  interface Chainable<Subject> {
    /** Custom Cypress command to get an element input
    * @example
    * cy.getByTestId('myTestId').should('be.visible');
    */
    getInput<E extends Node = HTMLElement>(selector:string,args:any): Chainable<Cypress.Chainable<JQuery<E>>>
    
    /** Custom Cypress command to get by data-testid attribute
    * @example
    * cy.getByTestId('title').should('have.text', ' Azion Console ')
    */
     getByTestId<E extends Node = HTMLElement>(selector:string,args:any): Chainable<Cypress.Chainable<JQuery<E>>>
  }
}