/**
 * Network Lists - Update Tests (Self-Contained)
 *
 * API: PUT v4/workspace/network_lists/{id}
 * Route: /network-lists/edit/:id
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/network-lists'

const generateListName = (prefix = 'NetList_UPD') => {
  return `${prefix}_${Date.now()}`
}

const createList = (name) => {
  // Use button directly, not the label inside it
  cy.get('[data-testid="create_Network List_button"]', { timeout: 15000 })
    .should('be.visible')
    .click()

  cy.get(selectors.nameInput, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(name)

  cy.get(selectors.asnTextarea, { timeout: 10000 })
    .should('be.visible')
    .type('12345')

  cy.get(selectors.saveButton).click()

  // Wait for success toast
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

  cy.openProduct('Network Lists')
  cy.get('.p-datatable', { timeout: 15000 }).should('exist')

  tableHelpers.searchAndSubmit(name)
  cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
    .contains(name)
    .should('exist')
}

describe('Network Lists - Update', { tags: ['@crud', '@network-lists', '@v4'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Network Lists')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
  })

  it('should update list name', () => {
    const originalName = generateListName('UPD_NAME')
    createList(originalName)

    cy.get('[data-testid*="list-table-block__column__name"]')
      .contains(originalName)
      .click()

    cy.get(selectors.nameInput, { timeout: 15000 })
      .should('have.value', originalName)

    const newName = `${originalName}_UPDATED`
    cy.get(selectors.nameInput)
      .clear()
      .type(newName)

    cy.get(selectors.saveButton).click()

    cy.get('.p-toast-message-success', { timeout: 30000 })
      .should('be.visible')
  })

  it('should update list items', () => {
    const listName = generateListName('UPD_ITEMS')
    createList(listName)

    cy.get('[data-testid*="list-table-block__column__name"]')
      .contains(listName)
      .click()

    cy.get(selectors.asnTextarea, { timeout: 15000 })
      .should('be.visible')
      .clear()
      .type('99999\n88888')

    cy.get(selectors.saveButton).click()

    cy.get('.p-toast-message-success', { timeout: 30000 })
      .should('be.visible')
  })

  it('should show validation error for empty name', () => {
    const listName = generateListName('UPD_VALID')
    createList(listName)

    cy.get('[data-testid*="list-table-block__column__name"]')
      .contains(listName)
      .click()

    cy.get(selectors.nameInput, { timeout: 15000 })
      .clear()
      .blur()

    cy.get(selectors.saveButton).click()

    cy.get('body').then(($body) => {
      if ($body.find('.p-error, [data-testid*="error"]').length) {
        cy.get('.p-error, [data-testid*="error"]').should('be.visible')
      } else {
        cy.url().should('include', '/network-lists/edit/')
      }
    })
  })

  it('should cancel update and return to list', () => {
    const listName = generateListName('UPD_CANCEL')
    createList(listName)

    cy.get('[data-testid*="list-table-block__column__name"]')
      .contains(listName)
      .click()

    cy.get(selectors.nameInput, { timeout: 15000 })
      .type('_MODIFIED')

    cy.get(selectors.cancelButton).click()

    cy.get('body').then(($body) => {
      if ($body.find('.p-dialog-footer button').length) {
        cy.get('.p-dialog-footer button').contains(/leave|discard|confirm/i).click()
      }
    })

    cy.get('.p-datatable', { timeout: 30000 }).should('exist')
  })
})
