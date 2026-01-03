/**
 * Users - Update Tests
 *
 * API: PATCH v4/iam/users/{id}
 * Route: /users/edit/:id
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

const generateUserData = (prefix = 'User') => {
  const timestamp = Date.now()
  return {
    firstName: `${prefix}First_${timestamp}`,
    lastName: `${prefix}Last_${timestamp}`,
    email: `testuser_${timestamp}@azion-test.com`
  }
}

// Helper to check if list has data
const hasListData = () => {
  return cy.get('body').then(($body) => {
    const hasTable = $body.find('.p-datatable').length > 0
    const hasRows = $body.find('[data-testid*="list-table-block__column"]').length > 0
    return hasTable && hasRows
  })
}

const createUserForUpdate = (userData) => {
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
}

describe('Users - Update', { tags: ['@crud', '@users', '@v4'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Users Management')
    tableHelpers.waitForListReady()
  })

  describe('Edit Navigation', () => {
    it('should navigate to edit page when clicking a row', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          cy.get('[data-testid*="list-table-block__column"]')
            .first()
            .click()

          cy.url({ timeout: 15000 }).should('include', '/users/edit/')
          cy.get(selectors.form.firstNameInput, { timeout: 15000 }).should('exist')
        } else {
          cy.log('No users - creating one for test')
          const userData = generateUserData('UPDATE_NAV')
          createUserForUpdate(userData)

          cy.get('[data-testid*="list-table-block__column"]')
            .first()
            .click()
          cy.url({ timeout: 15000 }).should('include', '/users/edit/')
        }
      })
    })
  })

  describe('Successful Update', () => {
    it('should update user first name', () => {
      const originalData = generateUserData('UPDATE_ORIG')
      const updatedFirstName = `Updated_${Date.now()}`

      createUserForUpdate(originalData)

      tableHelpers.searchAndSubmit(originalData.firstName)
      cy.get('[data-testid*="list-table-block__column"]')
        .first()
        .click()

      cy.get(selectors.form.firstNameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(updatedFirstName)

      cy.get(selectors.submitButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')

      cy.openProduct('Users Management')
      tableHelpers.waitForListReady()
      tableHelpers.searchAndSubmit(updatedFirstName)

      cy.get('[data-testid*="list-table-block__column"]', { timeout: 15000 })
        .should('contain', updatedFirstName)
    })
  })

  describe('Form Validation', () => {
    it('should prevent saving with empty first name', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          cy.get('[data-testid*="list-table-block__column"]')
            .first()
            .click()

          cy.get(selectors.form.firstNameInput, { timeout: 15000 })
            .should('be.visible')
            .clear()
            .blur()

          cy.get(selectors.submitButton).click()

          cy.get('body').then(($body) => {
            if ($body.find('.p-error, [data-testid*="error"]').length) {
              cy.get('.p-error, [data-testid*="error"]').should('be.visible')
            } else {
              cy.url().should('include', '/users/edit/')
            }
          })
        } else {
          cy.log('No users - skipping validation test')
        }
      })
    })
  })
})
