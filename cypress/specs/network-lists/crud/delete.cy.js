/**
 * Network Lists - Delete Tests (Self-Contained)
 *
 * API: DELETE v4/workspace/network_lists/{id}
 * Route: /network-lists
 *
 * Aprendizados:
 * - Delete confirmation usa o NOME da lista
 * - Network Lists pode ter múltiplas actions ou action única
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/network-lists'

const generateListName = (prefix = 'NetList_DEL') => {
  return `${prefix}_${Date.now()}`
}

const createListForDelete = (name) => {
  cy.get(selectors.createButton, { timeout: 15000 }).click()

  cy.get(selectors.nameInput, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(name)

  cy.get(selectors.asnTextarea, { timeout: 10000 })
    .should('be.visible')
    .type('12345')

  cy.get(selectors.saveButton).click()
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

  cy.openProduct('Network Lists')
  cy.get('.p-datatable', { timeout: 15000 }).should('exist')

  tableHelpers.searchAndSubmit(name)
  cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
    .contains(name)
    .should('exist')
}

describe('Network Lists - Delete', { tags: ['@crud', '@network-lists', '@v4'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Network Lists')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
  })

  it('should delete list from list view', () => {
    const listName = generateListName('DEL_BASIC')
    createListForDelete(listName)

    // Click action button (single or menu)
    cy.get('[data-testid="data-table-actions-column-body-action-button"], [data-testid="data-table-actions-column-body-actions-menu-button"]')
      .first()
      .click()

    // If menu opened, click delete
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid*="Delete"]').length) {
        cy.get('[data-testid*="Delete"]').first().click()
      }
    })

    // Confirmation dialog - type list name
    cy.get('[data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
      .should('be.visible')
      .type(listName)

    cy.get('[data-testid="delete-dialog-footer-delete-button"]').click()

    cy.get('.p-toast-message-success', { timeout: 15000 })
      .should('be.visible')
      .and('contain', 'deleted')

    cy.get('.p-datatable', { timeout: 15000 }).should('exist')

    cy.get(selectors.searchInput).clear().type(`${listName}{enter}`)

    cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 15000 })
      .should('exist')
  })

  it('should show confirmation dialog before delete', () => {
    const listName = generateListName('DEL_DIALOG')
    createListForDelete(listName)

    cy.get('[data-testid="data-table-actions-column-body-action-button"], [data-testid="data-table-actions-column-body-actions-menu-button"]')
      .first()
      .click()

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid*="Delete"]').length) {
        cy.get('[data-testid*="Delete"]').first().click()
      }
    })

    cy.get('[data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
      .should('be.visible')

    cy.get('[data-testid="delete-dialog-footer-cancel-button"]')
      .should('be.visible')
  })

  it('should cancel delete operation', () => {
    const listName = generateListName('DEL_CANCEL')
    createListForDelete(listName)

    cy.get('[data-testid="data-table-actions-column-body-action-button"], [data-testid="data-table-actions-column-body-actions-menu-button"]')
      .first()
      .click()

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid*="Delete"]').length) {
        cy.get('[data-testid*="Delete"]').first().click()
      }
    })

    cy.get('[data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
      .should('be.visible')

    cy.get('[data-testid="delete-dialog-footer-cancel-button"]').click()

    cy.get('[data-testid="delete-dialog-confirmation-input-field"]').should('not.exist')

    tableHelpers.searchAndSubmit(listName)
    cy.get('[data-testid*="list-table-block__column__name"]')
      .contains(listName)
      .should('exist')
  })

  it('should require correct name to enable delete button', () => {
    const listName = generateListName('DEL_CONFIRM')
    createListForDelete(listName)

    cy.get('[data-testid="data-table-actions-column-body-action-button"], [data-testid="data-table-actions-column-body-actions-menu-button"]')
      .first()
      .click()

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid*="Delete"]').length) {
        cy.get('[data-testid*="Delete"]').first().click()
      }
    })

    cy.get('[data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
      .should('be.visible')

    cy.get('[data-testid="delete-dialog-footer-delete-button"]')
      .should('be.disabled')

    cy.get('[data-testid="delete-dialog-confirmation-input-field"]')
      .type('wrong_name')

    cy.get('[data-testid="delete-dialog-footer-delete-button"]')
      .should('be.disabled')

    cy.get('[data-testid="delete-dialog-confirmation-input-field"]')
      .clear()
      .type(listName)

    cy.get('[data-testid="delete-dialog-footer-delete-button"]')
      .should('not.be.disabled')
  })
})
