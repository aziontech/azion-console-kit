/// <reference types="Cypress" />

import { mockOk } from '../utils/http-mocks'

const navigateToDomains = () => {
  cy.visit('/domains')
}
const mockDomainsList = () => {
  mockOk('GET', '/api/v3/domains*', {
    fixture: 'domains/domains.json',
    alias: 'list-domains'
  })
  mockOk('GET', '/api/v3/edge_applications*', {
    fixture: 'domains/edge-applications.json',
    alias: 'list-edge-application'
  })
}

const searchDomainByText = (searchText) => {
  cy.get('.flex > .p-inputtext').as('searchField')
  cy.get('@searchField').type(searchText)
  cy.get('@searchField').should('have.value', searchText)
}

describe('Domain journey', () => {
  beforeEach(() => {
    cy.loginWithEmail(Cypress.env('EMAIL_STAGE'), Cypress.env('PASSWORD_STAGE'))
  })
  const domainNameMock = `domain-${Date.now()}`

  it('Should be able to visit home page and create,edit, list and delete an domain', () => {
    // Go to domains
    cy.visit('/')
    cy.getByTestId('create-button').click()
    cy.get('.p-dialog-header-icon > .p-icon > path').click()
    cy.get('.top-0 > .w-full > .gap-3 > .p-button').click()
    cy.get('#pv_id_18_2 > .p-menuitem-content > .flex').click()
    cy.get('.p-datatable-header > .flex-wrap > .p-button > .p-button-label').click()
    //Fill domain data
    cy.get('#name').type(domainNameMock)
    cy.get('#edge_application > .p-dropdown-label').click()
    cy.get('#edge_application_0').click()
    cy.get('#cnameAccessOnly > .p-inputswitch-slider').click()
    cy.get('.max-md\\:w-full > .p-button-label').click()
    // Submit
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

  it('should be able to use pagination', () => {
    mockDomainsList()
    navigateToDomains()
    cy.wait(['@list-domains', '@list-edge-application'])

    // navigate between pages
    cy.get('[aria-label="2"]').click()
    cy.get('[aria-label="3"]').click()
    cy.get('[aria-label="4"]').click()
    cy.get('[aria-label="5"]').click()
    cy.get('[aria-label="6"]').click()
    cy.get('[aria-label="7"]').click()
    // change page size
    cy.get('#pv_id_56 > .p-dropdown-trigger > .p-icon').click()
    cy.get('#pv_id_56_3').click()
  })

  it('should be able to find domains by search', () => {
    mockDomainsList()
    navigateToDomains()
    cy.wait(['@list-domains', '@list-edge-application'])

    const searchText = 'angular'
    cy.get('.flex > .p-inputtext').as('searchField')
    cy.get('@searchField').type(searchText, { delay: 40 })
    cy.get('@searchField').should('have.value', searchText)

    cy.get('.p-datatable-tbody > [tabindex="0"] > :nth-child(1) > div').should(
      'have.text',
      'ANGULAR'
    )
  })

  it('Should be able to use domain url from the list of domains', () => {
    mockDomainsList()
    navigateToDomains()
    cy.wait(['@list-domains', '@list-edge-application'])

    searchDomainByText('angular')
    cy.get('[data-testid="column-0"]').first().should('have.text', 'ANGULAR')

    const pasteText = 'hd2qe5xgzp.map.azionedge.net'
    cy.get('[tabindex="0"] > :nth-child(3) > [data-testid="column-2"] > .p-button').click()
    cy.get('@searchField').clear()
    cy.get('@searchField').focus()
    cy.get('@searchField').invoke('val', pasteText).trigger('input')

    cy.get('.whitespace-pre').as('domainColumnData').should('have.text', 'hd2qe5xgzp.map....')
    cy.get('.underline').click()
    cy.get('@domainColumnData').should('have.text', pasteText)
  })
})
