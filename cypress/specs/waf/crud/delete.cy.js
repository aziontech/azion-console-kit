/**
 * WAF Rules - Delete Tests
 *
 * API: DELETE v4/workspace/wafs/{id}
 * Route: /waf
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/waf-product'

const generateWafName = (prefix = 'WAF_DEL') => {
  return `${prefix}_${Date.now()}`
}

// Wait for create form to be ready
const waitForCreateForm = () => {
  cy.get(selectors.nameInput, { timeout: 15000 }).should('be.visible')
}

const createWafForDelete = (name) => {
  cy.get(selectors.createButton, { timeout: 15000 }).click()
  waitForCreateForm()
  cy.get(selectors.nameInput)
    .clear()
    .type(name)
  cy.get('[data-testid="form-actions-submit-button"]').click()
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
  cy.openProduct('WAF Rules')
  tableHelpers.waitForListReady()
  tableHelpers.searchAndSubmit(name)
  cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
    .contains(name)
    .should('exist')
}

describe('WAF Rules - Delete', { tags: ['@crud', '@waf', '@v4'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('WAF Rules')
    tableHelpers.waitForListReady()
  })

  it('should delete WAF rule from list', () => {
    const wafName = generateWafName('DEL_BASIC')
    createWafForDelete(wafName)

    cy.get('[data-testid="data-table-actions-column-body-actions-menu-button"]').first().click()
    cy.get('[data-testid*="delete"], [role="menuitem"]').contains(/delete/i).click()

    cy.get('[data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
      .should('be.visible')
      .type(wafName)

    cy.get('[data-testid="delete-dialog-footer-delete-button"]').click()

    cy.get('.p-toast-message-success', { timeout: 15000 })
      .should('be.visible')
      .and('contain', 'deleted')

    tableHelpers.waitForListReady()
    tableHelpers.searchAndSubmit(wafName)

    cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 15000 })
      .should('exist')
  })

  it('should show confirmation dialog before delete', () => {
    const wafName = generateWafName('DEL_DIALOG')
    createWafForDelete(wafName)

    cy.get('[data-testid="data-table-actions-column-body-actions-menu-button"]').first().click()
    cy.get('[data-testid*="delete"], [role="menuitem"]').contains(/delete/i).click()

    cy.get('[data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
      .should('be.visible')

    cy.get('[data-testid="delete-dialog-footer-cancel-button"]')
      .should('be.visible')
  })

  it('should cancel delete operation', () => {
    const wafName = generateWafName('DEL_CANCEL')
    createWafForDelete(wafName)

    cy.get('[data-testid="data-table-actions-column-body-actions-menu-button"]').first().click()
    cy.get('[data-testid*="delete"], [role="menuitem"]').contains(/delete/i).click()

    cy.get('[data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
      .should('be.visible')

    cy.get('[data-testid="delete-dialog-footer-cancel-button"]').click()

    cy.get('[data-testid="delete-dialog-confirmation-input-field"]').should('not.exist')

    tableHelpers.searchAndSubmit(wafName)
    cy.get('[data-testid*="list-table-block__column__name"]')
      .contains(wafName)
      .should('exist')
  })

  it('should require correct name to enable delete button', () => {
    const wafName = generateWafName('DEL_CONFIRM')
    createWafForDelete(wafName)

    cy.get('[data-testid="data-table-actions-column-body-actions-menu-button"]').first().click()
    cy.get('[data-testid*="delete"], [role="menuitem"]').contains(/delete/i).click()

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
      .type(wafName)

    cy.get('[data-testid="delete-dialog-footer-delete-button"]')
      .should('not.be.disabled')
  })
})
