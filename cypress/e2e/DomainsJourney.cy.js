/// <reference types="Cypress" />

describe('Create and Edge application journey', () => {
  beforeEach(() => {
    cy.loginWithEmail(Cypress.env('username'), Cypress.env('password'))
  })
  // after(() => {
  //   Cypress.session.clearAllSavedSessions()
  // })

  const domainNameMock = `test-ede-${Date.now()}`

  it.only('Should be able to visit home page and create,edit, list and delete an domain', () => {
    cy.visit('/')
    cy.getByTestId('create-button').click()
    cy.get('.p-dialog-header-icon > .p-icon > path').click()
    cy.get('.top-0 > .w-full > .gap-3 > .p-button').click()
    cy.get('#pv_id_18_2 > .p-menuitem-content > .flex').click()
    cy.get('.p-datatable-header > .flex-wrap > .p-button > .p-button-label').click()
    cy.get('#name').clear('n')
    cy.get('#name').type(domainNameMock)
    cy.get('#edge_application > .p-dropdown-label').click()
    cy.get('#edge_application_0').click()
    cy.get('#cnameAccessOnly > .p-inputswitch-slider').click()
    cy.get('.max-md\\:w-full > .p-button-label').click()
    cy.contains('Your domain has been created', { timeout: 20000 })
    // Edit domain
    cy.get('.text-\\[var\\(--text-color\\)\\]', { timeout: 20000 }).should(
      'have.text',
      'Edit Domain'
    )
    cy.get('#name').should('have.value', domainNameMock)
    cy.get('.gap-6 > .p-button > .p-button-label').click()
    cy.contains('domain name copied')
    cy.get('.max-md\\:w-full > .p-button-label').click()
    cy.contains('Your domain has been edited', { timeout: 20000 })

    //List to Delete
    cy.get('.flex > .p-inputtext').type(domainNameMock)
    cy.get('[tabindex="0"] > .p-frozen-column > .flex > .p-button > .p-button-icon').click()
    cy.get('.p-menuitem-content > .p-menuitem-link').click()
    cy.get('#confirm-input').clear()
    cy.get('#confirm-input').type('delete')
    cy.get('.p-button-danger').should('be.enabled')
    cy.get('.p-button-danger > .p-button-label').click()
    cy.contains('Resource successfully deleted', { timeout: 10000 })
    cy.visit('/')
  })

  it('Should be able to create edge application', () => {
    cy.visit('/edge-applications')
    cy.contains('Edge Applications')
  })
})
