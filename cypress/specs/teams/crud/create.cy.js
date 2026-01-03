/**
 * Teams - Create Tests
 *
 * API: POST v4/iam/teams
 * Route: /teams-permission/create
 */

import { tableHelpers } from '../../../support/console-kit-helpers'

const selectors = {
  createButton: '[data-testid="create_Team_button"]',
  form: {
    nameInput: '[data-testid="teams-permissions-form__name__field-text__input"]',
    permissionsPicklist: '[data-testid="teams-permissions-form__permissions-field__picklist"]',
    moveToTargetButton: '[data-testid="teams-permissions-form__permissions-field-picklist__move-to-target-btn"]',
    moveAllToTargetButton: '[data-testid="teams-permissions-form__permissions-field-picklist__move-all-to-target-btn"]',
    sourceList: '[data-testid="teams-permissions-form__permissions-field-picklist__source-list"]'
  },
  submitButton: '[data-testid="form-actions-submit-button"]',
  cancelButton: '[data-testid="form-actions-cancel-button"]'
}

const generateTeamName = (prefix = 'Team') => {
  return `${prefix}_${Date.now()}`
}

const selectFirstPermission = () => {
  // Click on the first item in the source list to select it
  cy.get(selectors.form.sourceList, { timeout: 15000 })
    .find('.p-picklist-item')
    .first()
    .click()

  // Move it to the target list
  cy.get(selectors.form.moveToTargetButton).click()
}

describe('Teams - Create', { tags: ['@crud', '@teams', '@v4'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Teams Permissions')
    tableHelpers.waitForListReady()
  })

  describe('Successful Creation', () => {
    it('should create a team with name and permission', () => {
      const teamName = generateTeamName('BasicTeam')

      cy.get(selectors.createButton, { timeout: 15000 }).click()

      cy.get(selectors.form.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(teamName)

      // Select at least one permission (required)
      selectFirstPermission()

      cy.get(selectors.submitButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')
        .and('contain', 'created')

      cy.url({ timeout: 15000 }).should('satisfy', (url) => {
        return url.includes('/teams-permission/edit/') || url.includes('/teams-permission')
      })
    })

    it('should verify created team appears in list', () => {
      const teamName = generateTeamName('ListCheck')

      cy.get(selectors.createButton).click()
      cy.get(selectors.form.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(teamName)

      // Select at least one permission
      selectFirstPermission()

      cy.get(selectors.submitButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

      // Navigate back to list - handle possible "Unsaved changes" dialog
      cy.openProduct('Teams Permissions')

      // Handle "Unsaved changes" dialog if it appears
      cy.get('body').then(($body) => {
        if ($body.find('.p-dialog-footer button').length) {
          cy.get('.p-dialog-footer button').contains(/leave/i).click()
        }
      })

      tableHelpers.waitForListReady()

      tableHelpers.searchAndSubmit(teamName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', teamName)
    })
  })

  describe('Validation Errors', () => {
    it('should show error for empty name', () => {
      cy.get(selectors.createButton).click()

      cy.get(selectors.form.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .blur()

      cy.get(selectors.submitButton).click()

      cy.get('body').then(($body) => {
        if ($body.find('.p-error, [data-testid*="error"]').length) {
          cy.get('.p-error, [data-testid*="error"]').should('be.visible')
        } else {
          cy.url().should('include', '/teams-permission/create')
        }
      })
    })

    it('should show error when no permissions selected', () => {
      cy.get(selectors.createButton).click()

      cy.get(selectors.form.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type('TestTeamNoPerms')

      cy.get(selectors.submitButton).click()

      // Should show validation error about permissions
      cy.get('.p-error, [data-testid*="error"]', { timeout: 5000 })
        .should('be.visible')
    })
  })

  describe('Form Actions', () => {
    it('should cancel creation and return to list', () => {
      cy.get(selectors.createButton).click()

      cy.get(selectors.form.nameInput, { timeout: 15000 })
        .should('be.visible')
        .type('WillBeCancelled')

      cy.get(selectors.cancelButton).click()

      cy.get('body').then(($body) => {
        if ($body.find('.p-dialog-footer button').length) {
          cy.get('.p-dialog-footer button').contains(/leave|discard|confirm/i).click()
        }
      })

      tableHelpers.waitForListReady()
      cy.url().should('match', /\/teams-permission(\?|$)/)
    })
  })

  describe('Permissions Picklist', () => {
    it('should display permissions picklist in create form', () => {
      cy.get(selectors.createButton).click()

      cy.get(selectors.form.nameInput, { timeout: 15000 }).should('be.visible')
      cy.get(selectors.form.permissionsPicklist, { timeout: 10000 }).should('exist')
    })
  })
})
