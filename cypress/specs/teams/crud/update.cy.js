/**
 * Teams - Update Tests
 *
 * API: PATCH v4/iam/teams/{id}
 * Route: /teams-permission/edit/:id
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

const generateTeamName = (prefix = 'Team') => {
  return `${prefix}_${Date.now()}`
}

// Helper to check if list has data
const hasListData = () => {
  return cy.get('body').then(($body) => {
    const hasTable = $body.find('.p-datatable').length > 0
    const hasRows = $body.find('[data-testid*="list-table-block__column__name"]').length > 0
    return hasTable && hasRows
  })
}

const selectFirstPermission = () => {
  cy.get(selectors.form.sourceList, { timeout: 15000 })
    .find('.p-picklist-item')
    .first()
    .click()
  cy.get(selectors.form.moveToTargetButton).click()
}

const createTeamForUpdate = (name) => {
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
}

describe('Teams - Update', { tags: ['@crud', '@teams', '@v4'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Teams Permissions')
    tableHelpers.waitForListReady()
  })

  describe('Edit Navigation', () => {
    it('should navigate to edit page when clicking a row', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          cy.get('[data-testid*="list-table-block__column__name"]')
            .first()
            .click()

          cy.url({ timeout: 15000 }).should('include', '/teams-permission/edit/')
          cy.get(selectors.form.nameInput, { timeout: 15000 }).should('exist')
        } else {
          cy.log('No teams - creating one for test')
          const teamName = generateTeamName('UPDATE_NAV')
          createTeamForUpdate(teamName)

          cy.get('[data-testid*="list-table-block__column__name"]')
            .first()
            .click()
          cy.url({ timeout: 15000 }).should('include', '/teams-permission/edit/')
        }
      })
    })
  })

  describe('Successful Update', () => {
    it('should update team name', () => {
      const originalName = generateTeamName('UPDATE_ORIG')
      const updatedName = generateTeamName('UPDATE_NEW')

      createTeamForUpdate(originalName)

      tableHelpers.searchAndSubmit(originalName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(originalName)
        .click()

      cy.get(selectors.form.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(updatedName)

      cy.get(selectors.submitButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')

      cy.openProduct('Teams Permissions')
      tableHelpers.waitForListReady()
      tableHelpers.searchAndSubmit(updatedName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', updatedName)
    })
  })

  describe('Form Validation', () => {
    it('should prevent saving with empty name', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          cy.get('[data-testid*="list-table-block__column__name"]')
            .first()
            .click()

          cy.get(selectors.form.nameInput, { timeout: 15000 })
            .should('be.visible')
            .clear()
            .blur()

          cy.get(selectors.submitButton).click()

          cy.get('body').then(($body) => {
            if ($body.find('.p-error, [data-testid*="error"]').length) {
              cy.get('.p-error, [data-testid*="error"]').should('be.visible')
            } else {
              cy.url().should('include', '/teams-permission/edit/')
            }
          })
        } else {
          cy.log('No teams - skipping validation test')
        }
      })
    })
  })
})
