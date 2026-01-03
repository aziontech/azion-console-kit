/**
 * Users - Delete Tests
 *
 * API: DELETE v4/iam/users/{id}
 * Route: /users
 */

import { tableHelpers } from '../../../support/console-kit-helpers'

const selectors = {
  createButton: '[data-testid="create_User_button"]',
  form: {
    firstNameInput: '[data-testid="users-form__first-name-field__input"]',
    lastNameInput: '[data-testid="users-form__last-name-field__input"]',
    emailInput: '[data-testid="users-form__email-field__input"]',
    teamsMultiselect: '[data-testid="users-form__teams-field__multiselect"]'
  },
  submitButton: '[data-testid="form-actions-submit-button"]'
}

const selectFirstTeam = () => {
  cy.get(selectors.form.teamsMultiselect, { timeout: 15000 }).click()
  cy.get('.p-multiselect-panel', { timeout: 10000 })
    .should('be.visible')
    .find('.p-multiselect-item')
    .first()
    .click()
  cy.get('body').click(0, 0)
}

const generateUserData = (prefix = 'User_DEL') => {
  const timestamp = Date.now()
  return {
    firstName: `${prefix}First_${timestamp}`,
    lastName: `${prefix}Last_${timestamp}`,
    email: `testuser_del_${timestamp}@azion-test.com`
  }
}

const createUserForDelete = (userData) => {
  cy.get(selectors.createButton, { timeout: 15000 }).click()
  cy.get(selectors.form.firstNameInput, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(userData.firstName)
  cy.get(selectors.form.lastNameInput).clear().type(userData.lastName)
  cy.get(selectors.form.emailInput).clear().type(userData.email)

  // Select a team (required for non-account-owner users)
  selectFirstTeam()

  cy.get(selectors.submitButton).click()
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
  cy.openProduct('Users Management')
  tableHelpers.waitForListReady()
  tableHelpers.searchAndSubmit(userData.firstName)
  cy.get('[data-testid*="list-table-block__column"]', { timeout: 15000 })
    .should('contain', userData.firstName)
}

describe('Users - Delete', { tags: ['@crud', '@users', '@v4'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Users Management')
    tableHelpers.waitForListReady()
  })

  it('should delete user from list', () => {
    const userData = generateUserData('DEL_BASIC')
    createUserForDelete(userData)

    cy.get('[data-testid="data-table-actions-column-body-actions-menu-button"]').first().click()
    cy.get('[data-testid*="delete"], [role="menuitem"]').contains(/delete/i).click()

    cy.get('[data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
      .should('be.visible')
      .type(userData.email)

    cy.get('[data-testid="delete-dialog-footer-delete-button"]').click()

    cy.get('.p-toast-message-success', { timeout: 15000 })
      .should('be.visible')
      .and('contain', 'deleted')

    tableHelpers.waitForListReady()
    tableHelpers.searchAndSubmit(userData.firstName)

    cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 15000 })
      .should('exist')
  })

  it('should show confirmation dialog before delete', () => {
    const userData = generateUserData('DEL_DIALOG')
    createUserForDelete(userData)

    cy.get('[data-testid="data-table-actions-column-body-actions-menu-button"]').first().click()
    cy.get('[data-testid*="delete"], [role="menuitem"]').contains(/delete/i).click()

    cy.get('[data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
      .should('be.visible')

    cy.get('[data-testid="delete-dialog-footer-cancel-button"]')
      .should('be.visible')
  })

  it('should cancel delete operation', () => {
    const userData = generateUserData('DEL_CANCEL')
    createUserForDelete(userData)

    cy.get('[data-testid="data-table-actions-column-body-actions-menu-button"]').first().click()
    cy.get('[data-testid*="delete"], [role="menuitem"]').contains(/delete/i).click()

    cy.get('[data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
      .should('be.visible')

    cy.get('[data-testid="delete-dialog-footer-cancel-button"]').click()

    cy.get('[data-testid="delete-dialog-confirmation-input-field"]').should('not.exist')

    tableHelpers.searchAndSubmit(userData.firstName)
    cy.get('[data-testid*="list-table-block__column"]')
      .should('contain', userData.firstName)
  })
})
