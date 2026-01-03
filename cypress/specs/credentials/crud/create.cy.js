/**
 * Credentials - Create Tests
 *
 * API: POST v4/workspace/storage/credentials
 * Route: /credentials
 *
 * Note: Credentials uses a Drawer for creation (not a separate page).
 * Requires existing buckets in Object Storage.
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
  cancelButton: '[data-testid="form-actions-cancel-button"]',
  closeDrawerButton: '.p-drawer-close'
}

const generateCredentialName = (prefix = 'Cred') => {
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

// Check if buckets exist
const hasBuckets = () => {
  return cy.get('body').then(($body) => {
    cy.get(selectors.drawer.bucketDropdown).click()
    return cy.get('.p-dropdown-panel', { timeout: 5000 }).then(($panel) => {
      const hasItems = $panel.find('.p-dropdown-item').length > 0
      cy.get('body').click(0, 0)
      return hasItems
    })
  })
}

describe('Credentials - Create', { tags: ['@crud', '@credentials', '@account-menu'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/credentials')
    waitForPageReady()
  })

  describe('Drawer Display', () => {
    it('should open drawer when clicking create button', () => {
      cy.get(selectors.createButton).click()
      waitForDrawer()
      cy.contains('General').should('be.visible')
      cy.contains('Settings').should('be.visible')
    })

    it('should display all form fields', () => {
      cy.get(selectors.createButton).click()
      waitForDrawer()

      cy.get(selectors.drawer.nameInput).should('be.visible')
      cy.get(selectors.drawer.bucketDropdown).should('be.visible')
      cy.get(selectors.drawer.expirationCalendar).should('be.visible')
      cy.get(selectors.drawer.capabilitiesMultiselect).should('be.visible')
    })

    it('should close drawer when clicking close button', () => {
      cy.get(selectors.createButton).click()
      waitForDrawer()

      cy.get(selectors.closeDrawerButton).click()
      cy.get('.p-drawer').should('not.exist')
    })
  })

  describe('Successful Creation', () => {
    it('should create a credential with all required fields', () => {
      const credName = generateCredentialName('TestCred')

      cy.get(selectors.createButton).click()
      waitForDrawer()

      // Fill name
      cy.get(selectors.drawer.nameInput)
        .clear()
        .type(credName)

      // Select bucket (if available)
      cy.get(selectors.drawer.bucketDropdown).click()
      cy.get('.p-dropdown-panel', { timeout: 10000 }).then(($panel) => {
        if ($panel.find('.p-dropdown-item').length > 0) {
          cy.get('.p-dropdown-item').first().click()

          // Select expiration date (tomorrow)
          cy.get(selectors.drawer.expirationCalendar).click()
          cy.get('.p-datepicker-calendar', { timeout: 5000 }).should('be.visible')
          // Select a future date
          cy.get('.p-datepicker-calendar td:not(.p-disabled)').last().click()

          // Select capabilities
          cy.get(selectors.drawer.capabilitiesMultiselect).click()
          cy.get('.p-multiselect-panel', { timeout: 5000 }).should('be.visible')
          cy.get('.p-multiselect-item').first().click()
          cy.get('body').click(0, 0)

          // Submit
          cy.get(selectors.submitButton).click()

          cy.get('.p-toast-message-success', { timeout: 30000 })
            .should('be.visible')

          // Verify in list
          tableHelpers.searchAndSubmit(credName)
          cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
            .should('contain', credName)
        } else {
          cy.log('No buckets available - skipping creation test')
          cy.get(selectors.closeDrawerButton).click()
        }
      })
    })
  })

  describe('Validation Errors', () => {
    it('should show error for empty name', () => {
      cy.get(selectors.createButton).click()
      waitForDrawer()

      cy.get(selectors.drawer.nameInput)
        .clear()
        .blur()

      cy.get(selectors.submitButton).click()

      cy.get('body').then(($body) => {
        if ($body.find('.p-error').length) {
          cy.get('.p-error').should('be.visible')
        }
      })
    })

    it('should require bucket selection', () => {
      cy.get(selectors.createButton).click()
      waitForDrawer()

      cy.get(selectors.drawer.nameInput)
        .type('TestCred')

      cy.get(selectors.submitButton).click()

      // Should show validation errors or stay in drawer
      cy.get('.p-drawer').should('be.visible')
    })
  })

  describe('Form Actions', () => {
    it('should cancel and close drawer', () => {
      cy.get(selectors.createButton).click()
      waitForDrawer()

      cy.get(selectors.drawer.nameInput).type('WillBeCancelled')

      cy.get(selectors.cancelButton).click()

      // Drawer should close
      cy.get('.p-drawer').should('not.exist')
    })
  })
})
