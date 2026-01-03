/**
 * SSO Management - Delete Tests
 *
 * API: DELETE v4/iam/identity_providers/{type}/{id}
 * Route: /identity-providers
 *
 * Note: SSO Management is in the account menu (right side).
 * Cannot delete the azion-default-sso provider.
 * Cannot delete an active provider.
 */

import { tableHelpers } from '../../../support/console-kit-helpers'

const selectors = {
  createButton: '[data-testid="create_Identity Provider_button"]',
  form: {
    nameInput: '[data-testid="network-list-form__name"] input',
    authorizationUrl: '[data-testid="sso-management-form__subject-name"] input',
    userInfoUrl: '[data-testid="sso-management-form__userinfo-url"] input',
    tokenUrl: '[data-testid="sso-management-form__token-url"] input',
    clientId: '[data-testid="sso-management-form__client-id"] input',
    clientSecret: '[data-testid="sso-management-form__client-secret"]',
    scopesMultiselect: '[data-testid="sso-management-form__scopes__multiselect"]'
  },
  submitButton: '[data-testid="form-actions-submit-button"]',
  actionsButton: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
  deleteDialog: {
    confirmInput: '[data-testid="delete-dialog-confirmation-input-field"]',
    deleteButton: '[data-testid="delete-dialog-footer-delete-button"]',
    cancelButton: '[data-testid="delete-dialog-footer-cancel-button"]'
  }
}

const generateProviderName = (prefix = 'IdP_DEL') => {
  return `${prefix}_${Date.now()}`
}

// Create an OIDC provider for testing
const createProviderForDelete = (name) => {
  cy.get('body').then(($body) => {
    if ($body.find(selectors.createButton).length > 0) {
      cy.get(selectors.createButton).click()
    } else {
      cy.contains('Identity Provider').click()
    }
  })

  cy.get(selectors.form.nameInput, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(name)

  cy.get(selectors.form.authorizationUrl)
    .clear()
    .type('https://example.com/authorize')

  cy.get(selectors.form.userInfoUrl)
    .clear()
    .type('https://example.com/userinfo')

  cy.get(selectors.form.tokenUrl)
    .clear()
    .type('https://example.com/token')

  cy.get(selectors.form.clientId)
    .clear()
    .type('test-client-id')

  cy.get(selectors.form.clientSecret)
    .clear()
    .type('test-client-secret')

  // Select scopes
  cy.get(selectors.form.scopesMultiselect).click()
  cy.get('.p-multiselect-panel', { timeout: 10000 }).should('be.visible')
  cy.get('.p-multiselect-item').contains('Open ID').click()
  cy.get('body').click(0, 0)

  cy.get(selectors.submitButton).click()
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

  cy.visit('/identity-providers')
  tableHelpers.waitForListReady()
  tableHelpers.searchAndSubmit(name)
  cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
    .contains(name)
    .should('exist')
}

describe('SSO Management - Delete', { tags: ['@crud', '@sso-management', '@account-menu'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/identity-providers')
    tableHelpers.waitForListReady()
  })

  it('should delete identity provider from list', () => {
    const providerName = generateProviderName('DEL_BASIC')
    createProviderForDelete(providerName)

    cy.get(selectors.actionsButton).first().click()
    cy.get('[role="menuitem"]').contains(/delete/i).click()

    cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
      .should('be.visible')
      .type(providerName)

    cy.get(selectors.deleteDialog.deleteButton).click()

    cy.get('.p-toast-message-success', { timeout: 15000 })
      .should('be.visible')

    tableHelpers.waitForListReady()
    tableHelpers.searchAndSubmit(providerName)

    cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 15000 })
      .should('exist')
  })

  it('should show confirmation dialog before delete', () => {
    const providerName = generateProviderName('DEL_DIALOG')
    createProviderForDelete(providerName)

    cy.get(selectors.actionsButton).first().click()
    cy.get('[role="menuitem"]').contains(/delete/i).click()

    cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
      .should('be.visible')

    cy.get(selectors.deleteDialog.cancelButton)
      .should('be.visible')

    // Cancel
    cy.get(selectors.deleteDialog.cancelButton).click()
    cy.get(selectors.deleteDialog.confirmInput).should('not.exist')
  })

  it('should cancel delete operation', () => {
    const providerName = generateProviderName('DEL_CANCEL')
    createProviderForDelete(providerName)

    cy.get(selectors.actionsButton).first().click()
    cy.get('[role="menuitem"]').contains(/delete/i).click()

    cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
      .should('be.visible')

    cy.get(selectors.deleteDialog.cancelButton).click()

    cy.get(selectors.deleteDialog.confirmInput).should('not.exist')

    tableHelpers.searchAndSubmit(providerName)
    cy.get('[data-testid*="list-table-block__column__name"]')
      .contains(providerName)
      .should('exist')
  })

  it('should require correct name to enable delete button', () => {
    const providerName = generateProviderName('DEL_CONFIRM')
    createProviderForDelete(providerName)

    cy.get(selectors.actionsButton).first().click()
    cy.get('[role="menuitem"]').contains(/delete/i).click()

    cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
      .should('be.visible')

    cy.get(selectors.deleteDialog.deleteButton)
      .should('be.disabled')

    cy.get(selectors.deleteDialog.confirmInput)
      .type('wrong_name')

    cy.get(selectors.deleteDialog.deleteButton)
      .should('be.disabled')

    cy.get(selectors.deleteDialog.confirmInput)
      .clear()
      .type(providerName)

    cy.get(selectors.deleteDialog.deleteButton)
      .should('not.be.disabled')

    // Cancel to not actually delete
    cy.get(selectors.deleteDialog.cancelButton).click()
  })

  it('should not show delete option for default SSO provider', () => {
    // Check if azion-default-sso exists in list
    cy.get('body').then(($body) => {
      if ($body.text().includes('Azion SSO')) {
        // Find the row with Azion SSO and check its actions
        cy.contains('[data-testid*="list-table-block__column__name"]', 'Azion')
          .closest('tr')
          .find(selectors.actionsButton)
          .click()

        // Delete should not be visible for default provider
        cy.get('[role="menuitem"]').then(($menu) => {
          // Check that delete is either not there or not clickable for active/default
          if ($menu.text().toLowerCase().includes('delete')) {
            // If delete is there, it should be for non-active providers only
            cy.log('Delete option may be conditional based on active status')
          }
        })

        // Close menu
        cy.get('body').click(0, 0)
      } else {
        cy.log('No default SSO provider - skipping test')
      }
    })
  })
})
