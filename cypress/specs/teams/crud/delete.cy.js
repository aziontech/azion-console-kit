/**
 * Teams - Delete Tests
 *
 * API: DELETE v4/iam/teams/{id}
 * Route: /teams-permission
 */

import { tableHelpers } from '../../../support/console-kit-helpers'

const selectors = {
  createButton: '[data-testid="create_Team_button"]',
  form: {
    nameInput: '[data-testid="teams-permissions-form__name__field-text__input"]',
    sourceList: '[data-testid="teams-permissions-form__permissions-field-picklist__source-list"]',
    moveToTargetButton: '[data-testid="teams-permissions-form__permissions-field-picklist__move-to-target-btn"]'
  },
  submitButton: '[data-testid="form-actions-submit-button"]'
}

const generateTeamName = (prefix = 'Team_DEL') => {
  return `${prefix}_${Date.now()}`
}

const selectFirstPermission = () => {
  cy.get(selectors.form.sourceList, { timeout: 15000 })
    .find('.p-picklist-item')
    .first()
    .click()
  cy.get(selectors.form.moveToTargetButton).click()
}

const createTeamForDelete = (name) => {
  cy.get(selectors.createButton, { timeout: 15000 }).click()
  cy.get(selectors.form.nameInput, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(name)

  // Select at least one permission (required)
  selectFirstPermission()

  cy.get(selectors.submitButton).click()
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
  cy.openProduct('Teams Permissions')

  // Handle "Unsaved changes" dialog if it appears
  cy.get('body').then(($body) => {
    if ($body.find('.p-dialog-footer button').length) {
      cy.get('.p-dialog-footer button').contains(/leave/i).click()
    }
  })

  tableHelpers.waitForListReady()
  tableHelpers.searchAndSubmit(name)
  cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
    .contains(name)
    .should('exist')
}

describe('Teams - Delete', { tags: ['@crud', '@teams', '@v4'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Teams Permissions')
    tableHelpers.waitForListReady()
  })

  it('should delete team from list', () => {
    const teamName = generateTeamName('DEL_BASIC')
    createTeamForDelete(teamName)

    cy.get('[data-testid="data-table-actions-column-body-actions-menu-button"]').first().click()
    cy.get('[data-testid*="delete"], [role="menuitem"]').contains(/delete/i).click()

    cy.get('[data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
      .should('be.visible')
      .type(teamName)

    cy.get('[data-testid="delete-dialog-footer-delete-button"]').click()

    cy.get('.p-toast-message-success', { timeout: 15000 })
      .should('be.visible')
      .and('contain', 'deleted')

    tableHelpers.waitForListReady()
    tableHelpers.searchAndSubmit(teamName)

    cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 15000 })
      .should('exist')
  })

  it('should show confirmation dialog before delete', () => {
    const teamName = generateTeamName('DEL_DIALOG')
    createTeamForDelete(teamName)

    cy.get('[data-testid="data-table-actions-column-body-actions-menu-button"]').first().click()
    cy.get('[data-testid*="delete"], [role="menuitem"]').contains(/delete/i).click()

    cy.get('[data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
      .should('be.visible')

    cy.get('[data-testid="delete-dialog-footer-cancel-button"]')
      .should('be.visible')
  })

  it('should cancel delete operation', () => {
    const teamName = generateTeamName('DEL_CANCEL')
    createTeamForDelete(teamName)

    cy.get('[data-testid="data-table-actions-column-body-actions-menu-button"]').first().click()
    cy.get('[data-testid*="delete"], [role="menuitem"]').contains(/delete/i).click()

    cy.get('[data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
      .should('be.visible')

    cy.get('[data-testid="delete-dialog-footer-cancel-button"]').click()

    cy.get('[data-testid="delete-dialog-confirmation-input-field"]').should('not.exist')

    tableHelpers.searchAndSubmit(teamName)
    cy.get('[data-testid*="list-table-block__column__name"]')
      .contains(teamName)
      .should('exist')
  })

  it('should require correct name to enable delete button', () => {
    const teamName = generateTeamName('DEL_CONFIRM')
    createTeamForDelete(teamName)

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
      .type(teamName)

    cy.get('[data-testid="delete-dialog-footer-delete-button"]')
      .should('not.be.disabled')
  })
})
