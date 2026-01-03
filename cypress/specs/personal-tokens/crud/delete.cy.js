/**
 * Personal Tokens - Delete Tests
 *
 * API: DELETE v4/iam/personal_tokens/{id}
 * Route: /personal-tokens
 *
 * Note: Personal tokens cannot be updated, only created and deleted.
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/personal-tokens'

const generateTokenName = (prefix = 'Token_DEL') => {
  return `${prefix}_${Date.now()}`
}

const createTokenForDelete = (name) => {
  cy.get(selectors.createTokenButton, { timeout: 15000 }).click()
  cy.get(selectors.tokenName, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(name)
  cy.get(selectors.submitButton).click()
  cy.get(selectors.copyTokenDialogHeader, { timeout: 30000 }).should('be.visible')
  cy.get(selectors.closeCopyDialogButton).click()
  cy.visit('/personal-tokens')
  tableHelpers.waitForListReady()
  tableHelpers.searchAndSubmit(name)
  cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
    .contains(name)
    .should('exist')
}

describe('Personal Tokens - Delete', { tags: ['@crud', '@personal-tokens', '@v4'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/personal-tokens')
    tableHelpers.waitForListReady()
  })

  it('should delete personal token from list', () => {
    const tokenName = generateTokenName('DEL_BASIC')
    createTokenForDelete(tokenName)

    cy.get(selectors.filteredRecordMenuButton).first().click()
    cy.get('[data-testid*="delete"], [role="menuitem"]').contains(/delete/i).click()

    cy.get(selectors.deleteDialogConfirmationInputField, { timeout: 10000 })
      .should('be.visible')
      .type(tokenName)

    cy.get('[data-testid="delete-dialog-footer-delete-button"]').click()

    cy.get('.p-toast-message-success', { timeout: 15000 })
      .should('be.visible')
      .and('contain', 'deleted')

    tableHelpers.waitForListReady()
    tableHelpers.searchAndSubmit(tokenName)

    cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 15000 })
      .should('exist')
  })

  it('should show confirmation dialog before delete', () => {
    const tokenName = generateTokenName('DEL_DIALOG')
    createTokenForDelete(tokenName)

    cy.get(selectors.filteredRecordMenuButton).first().click()
    cy.get('[data-testid*="delete"], [role="menuitem"]').contains(/delete/i).click()

    cy.get(selectors.deleteDialogConfirmationInputField, { timeout: 10000 })
      .should('be.visible')

    cy.get('[data-testid="delete-dialog-footer-cancel-button"]')
      .should('be.visible')
  })

  it('should cancel delete operation', () => {
    const tokenName = generateTokenName('DEL_CANCEL')
    createTokenForDelete(tokenName)

    cy.get(selectors.filteredRecordMenuButton).first().click()
    cy.get('[data-testid*="delete"], [role="menuitem"]').contains(/delete/i).click()

    cy.get(selectors.deleteDialogConfirmationInputField, { timeout: 10000 })
      .should('be.visible')

    cy.get('[data-testid="delete-dialog-footer-cancel-button"]').click()

    cy.get(selectors.deleteDialogConfirmationInputField).should('not.exist')

    tableHelpers.searchAndSubmit(tokenName)
    cy.get('[data-testid*="list-table-block__column__name"]')
      .contains(tokenName)
      .should('exist')
  })

  it('should require correct name to enable delete button', () => {
    const tokenName = generateTokenName('DEL_CONFIRM')
    createTokenForDelete(tokenName)

    cy.get(selectors.filteredRecordMenuButton).first().click()
    cy.get('[data-testid*="delete"], [role="menuitem"]').contains(/delete/i).click()

    cy.get(selectors.deleteDialogConfirmationInputField, { timeout: 10000 })
      .should('be.visible')

    cy.get('[data-testid="delete-dialog-footer-delete-button"]')
      .should('be.disabled')

    cy.get(selectors.deleteDialogConfirmationInputField)
      .type('wrong_name')

    cy.get('[data-testid="delete-dialog-footer-delete-button"]')
      .should('be.disabled')

    cy.get(selectors.deleteDialogConfirmationInputField)
      .clear()
      .type(tokenName)

    cy.get('[data-testid="delete-dialog-footer-delete-button"]')
      .should('not.be.disabled')
  })
})
