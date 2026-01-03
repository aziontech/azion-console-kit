/**
 * Credentials - Delete Tests
 *
 * API: DELETE v4/workspace/storage/credentials/{id}
 * Route: /credentials
 *
 * Note: Credentials only supports delete (no edit).
 */

import { tableHelpers } from '../../../support/console-kit-helpers'

const selectors = {
  contentBlock: '[data-testid="credentials-content-block"]',
  objectStorageTab: '[data-testid="credentials-tab-panel__Object Storage__tab"]',
  createButton: '[data-testid="create_Credential_button"]',
  drawer: {
    nameInput: '[data-testid="credential-form__name-field"] input',
    bucketDropdown: '[data-testid="credential-form__bucket-field"]',
    expirationCalendar: '[data-testid="credential-form__expiration-field"]',
    capabilitiesMultiselect: '[data-testid="credential-form__capabilities-field"]'
  },
  submitButton: '[data-testid="form-actions-submit-button"]',
  actionsButton: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
  deleteDialog: {
    confirmInput: '[data-testid="delete-dialog-confirmation-input-field"]',
    deleteButton: '[data-testid="delete-dialog-footer-delete-button"]',
    cancelButton: '[data-testid="delete-dialog-footer-cancel-button"]'
  }
}

const generateCredentialName = (prefix = 'Cred_DEL') => {
  return `${prefix}_${Date.now()}`
}

// Wait for Credentials page to be ready
const waitForPageReady = () => {
  cy.get(selectors.contentBlock, { timeout: 15000 }).should('be.visible')
  cy.get(selectors.objectStorageTab, { timeout: 10000 }).should('be.visible')
  tableHelpers.waitForListReady()
}

// Wait for drawer to be visible
const waitForDrawer = () => {
  cy.get('.p-drawer', { timeout: 10000 }).should('be.visible')
  cy.get(selectors.drawer.nameInput, { timeout: 10000 }).should('be.visible')
}

// Create a credential for deletion test
const createCredentialForDelete = (name) => {
  cy.get(selectors.createButton).click()
  waitForDrawer()

  cy.get(selectors.drawer.nameInput)
    .clear()
    .type(name)

  cy.get(selectors.drawer.bucketDropdown).click()
  cy.get('.p-dropdown-panel', { timeout: 10000 }).then(($panel) => {
    if ($panel.find('.p-dropdown-item').length > 0) {
      cy.get('.p-dropdown-item').first().click()

      cy.get(selectors.drawer.expirationCalendar).click()
      cy.get('.p-datepicker-calendar', { timeout: 5000 }).should('be.visible')
      cy.get('.p-datepicker-calendar td:not(.p-disabled)').last().click()

      cy.get(selectors.drawer.capabilitiesMultiselect).click()
      cy.get('.p-multiselect-panel', { timeout: 5000 }).should('be.visible')
      cy.get('.p-multiselect-item').first().click()
      cy.get('body').click(0, 0)

      cy.get(selectors.submitButton).click()
      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

      tableHelpers.waitForListReady()
      tableHelpers.searchAndSubmit(name)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', name)
      return true
    } else {
      cy.log('No buckets available - cannot create credential')
      cy.get('.p-drawer-close').click()
      return false
    }
  })
}

// Helper to check if list has data
const hasListData = () => {
  return cy.get('body').then(($body) => {
    const hasTable = $body.find('.p-datatable').length > 0
    const hasRows = $body.find('[data-testid*="list-table-block__column__name"]').length > 0
    return hasTable && hasRows
  })
}

describe('Credentials - Delete', { tags: ['@crud', '@credentials', '@account-menu'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/credentials')
    waitForPageReady()
  })

  it('should delete credential from list', () => {
    const credName = generateCredentialName('DEL_BASIC')

    // Try to create a credential first
    cy.get(selectors.createButton).click()
    waitForDrawer()

    cy.get(selectors.drawer.bucketDropdown).click()
    cy.get('.p-dropdown-panel', { timeout: 10000 }).then(($panel) => {
      if ($panel.find('.p-dropdown-item').length > 0) {
        cy.get('.p-dropdown-item').first().click()

        cy.get(selectors.drawer.nameInput)
          .clear()
          .type(credName)

        cy.get(selectors.drawer.expirationCalendar).click()
        cy.get('.p-datepicker-calendar td:not(.p-disabled)').last().click()

        cy.get(selectors.drawer.capabilitiesMultiselect).click()
        cy.get('.p-multiselect-item').first().click()
        cy.get('body').click(0, 0)

        cy.get(selectors.submitButton).click()
        cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

        tableHelpers.waitForListReady()
        tableHelpers.searchAndSubmit(credName)

        // Delete
        cy.get(selectors.actionsButton).first().click()
        cy.get('[role="menuitem"]').contains(/delete/i).click()

        cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
          .should('be.visible')
          .type(credName)

        cy.get(selectors.deleteDialog.deleteButton).click()

        cy.get('.p-toast-message-success', { timeout: 15000 })
          .should('be.visible')

        tableHelpers.waitForListReady()
        tableHelpers.searchAndSubmit(credName)

        cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 15000 })
          .should('exist')
      } else {
        cy.log('No buckets available - skipping delete test')
        cy.get('.p-drawer-close').click()
      }
    })
  })

  it('should show confirmation dialog before delete', () => {
    hasListData().then((hasData) => {
      if (hasData) {
        cy.get(selectors.actionsButton).first().click()
        cy.get('[role="menuitem"]').contains(/delete/i).click()

        cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
          .should('be.visible')

        cy.get(selectors.deleteDialog.cancelButton)
          .should('be.visible')
          .click()

        cy.get(selectors.deleteDialog.confirmInput).should('not.exist')
      } else {
        cy.log('No credentials to delete - skipping test')
      }
    })
  })

  it('should cancel delete operation', () => {
    hasListData().then((hasData) => {
      if (hasData) {
        cy.get('[data-testid*="list-table-block__column__name"]')
          .first()
          .invoke('text')
          .then((credName) => {
            cy.get(selectors.actionsButton).first().click()
            cy.get('[role="menuitem"]').contains(/delete/i).click()

            cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
              .should('be.visible')

            cy.get(selectors.deleteDialog.cancelButton).click()

            cy.get(selectors.deleteDialog.confirmInput).should('not.exist')

            // Credential should still exist
            cy.get('[data-testid*="list-table-block__column__name"]')
              .first()
              .should('contain', credName.trim())
          })
      } else {
        cy.log('No credentials - skipping test')
      }
    })
  })
})
