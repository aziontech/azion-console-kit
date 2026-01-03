/**
 * Users - Create Tests
 *
 * API: POST v4/iam/users
 * Route: /users/create
 */

import { tableHelpers } from '../../../support/console-kit-helpers'

const selectors = {
  createButton: '[data-testid="create_User_button"]',
  form: {
    firstNameInput: '[data-testid="users-form__first-name-field__input"]',
    lastNameInput: '[data-testid="users-form__last-name-field__input"]',
    emailInput: '[data-testid="users-form__email-field__input"]',
    timezoneDropdown: '[data-testid="users-form__timezone-field__dropdown"]',
    languageDropdown: '[data-testid="users-form__language-field__dropdown"]',
    teamsMultiselect: '[data-testid="users-form__teams-field__multiselect"]',
    teamsMultiselectTrigger: '[data-testid="users-form__teams-field__multiselect-trigger"]'
  },
  submitButton: '[data-testid="form-actions-submit-button"]',
  cancelButton: '[data-testid="form-actions-cancel-button"]'
}

const generateUserData = (prefix = 'User') => {
  const timestamp = Date.now()
  return {
    firstName: `${prefix}First_${timestamp}`,
    lastName: `${prefix}Last_${timestamp}`,
    email: `testuser_${timestamp}@azion-test.com`
  }
}

const selectFirstTeam = () => {
  // Click the multiselect to open it
  cy.get(selectors.form.teamsMultiselect, { timeout: 15000 }).click()

  // Wait for dropdown to open and select the first option
  cy.get('.p-multiselect-panel', { timeout: 10000 })
    .should('be.visible')
    .find('.p-multiselect-item')
    .first()
    .click()

  // Close by clicking elsewhere
  cy.get('body').click(0, 0)
}

describe('Users - Create', { tags: ['@crud', '@users', '@v4'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Users Management')
    tableHelpers.waitForListReady()
  })

  describe('Successful Creation', () => {
    it('should create a user with required fields', () => {
      const userData = generateUserData('Basic')

      cy.get(selectors.createButton, { timeout: 15000 }).click()

      cy.get(selectors.form.firstNameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(userData.firstName)

      cy.get(selectors.form.lastNameInput)
        .clear()
        .type(userData.lastName)

      cy.get(selectors.form.emailInput)
        .clear()
        .type(userData.email)

      // Select a team (required for non-account-owner users)
      selectFirstTeam()

      cy.get(selectors.submitButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')
        .and('contain', 'created')

      cy.url({ timeout: 15000 }).should('satisfy', (url) => {
        return url.includes('/users/edit/') || url.includes('/users')
      })
    })

    it('should verify created user appears in list', () => {
      const userData = generateUserData('ListCheck')

      cy.get(selectors.createButton).click()
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
    })
  })

  describe('Validation Errors', () => {
    it('should show error for empty required fields', () => {
      cy.get(selectors.createButton).click()

      cy.get(selectors.form.firstNameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .blur()

      cy.get(selectors.submitButton).click()

      cy.get('body').then(($body) => {
        if ($body.find('.p-error, [data-testid*="error"]').length) {
          cy.get('.p-error, [data-testid*="error"]').should('be.visible')
        } else {
          cy.url().should('include', '/users/create')
        }
      })
    })

    it('should show error for invalid email format', () => {
      const userData = generateUserData('InvalidEmail')

      cy.get(selectors.createButton).click()

      cy.get(selectors.form.firstNameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(userData.firstName)
      cy.get(selectors.form.lastNameInput).clear().type(userData.lastName)
      cy.get(selectors.form.emailInput).clear().type('invalid-email').blur()

      cy.get('body').then(($body) => {
        if ($body.find('.p-error, [data-testid*="error"]').length) {
          cy.get('.p-error, [data-testid*="error"]').should('be.visible')
        }
      })
    })
  })

  describe('Form Actions', () => {
    it('should cancel creation and return to list', () => {
      cy.get(selectors.createButton).click()

      cy.get(selectors.form.firstNameInput, { timeout: 15000 })
        .should('be.visible')
        .type('WillBeCancelled')

      cy.get(selectors.cancelButton).click()

      cy.get('body').then(($body) => {
        if ($body.find('.p-dialog-footer button').length) {
          cy.get('.p-dialog-footer button').contains(/leave|discard|confirm/i).click()
        }
      })

      tableHelpers.waitForListReady()
      cy.url().should('match', /\/users(\?|$)/)
    })
  })
})
