/**
 * Edge Storage - Create Tests
 *
 * API: POST v4/workspace/storage
 * Route: /object-storage/create
 *
 * Note: Bucket names are used as IDs.
 * Edge Access options: read_write, read_only, restricted
 */

import { tableHelpers } from '../../../support/console-kit-helpers'

const selectors = {
  nameInput: '[data-testid="edge-storage-form__name-field"] input',
  edgeAccessDropdown: '[data-testid="edge-storage-form__edge-access-field"]',
  submitButton: '[data-testid="form-actions-submit-button"]',
  cancelButton: '[data-testid="form-actions-cancel-button"]',
  createButton: '[data-testid="create_Bucket_button"]'
}

const generateBucketName = (prefix = 'bucket') => {
  return `${prefix}-${Date.now()}`
}

// Wait for create page to be ready
const waitForPageReady = () => {
  cy.get(selectors.nameInput, { timeout: 15000 }).should('be.visible')
}

describe('Edge Storage - Create', { tags: ['@crud', '@edge-storage'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/object-storage/create')
    waitForPageReady()
  })

  describe('Page Display', () => {
    it('should display create bucket page', () => {
      cy.url().should('include', '/object-storage/create')
      cy.contains('Create Bucket').should('be.visible')
    })

    it('should display General section', () => {
      cy.contains('General').should('be.visible')
    })

    it('should display Settings section', () => {
      cy.contains('Settings').should('be.visible')
    })

    it('should display name field', () => {
      cy.get(selectors.nameInput).should('be.visible')
      cy.contains('Name').should('be.visible')
    })

    it('should display Workloads Access dropdown', () => {
      cy.get(selectors.edgeAccessDropdown).should('be.visible')
      cy.contains('Workloads Access').should('be.visible')
    })

    it('should display submit and cancel buttons', () => {
      cy.get(selectors.submitButton).should('be.visible')
      cy.get(selectors.cancelButton).should('be.visible')
    })
  })

  describe('Edge Access Options', () => {
    it('should have Read & Write selected by default', () => {
      cy.get(selectors.edgeAccessDropdown)
        .find('.p-dropdown-label')
        .should('contain', 'Read & Write')
    })

    it('should show all access options', () => {
      cy.get(selectors.edgeAccessDropdown).click()
      cy.get('.p-dropdown-panel', { timeout: 5000 }).should('be.visible')

      cy.get('.p-dropdown-item').should('contain', 'Read & Write')
      cy.get('.p-dropdown-item').should('contain', 'Read Only')
      cy.get('.p-dropdown-item').should('contain', 'Restricted')

      cy.get('body').click(0, 0)
    })
  })

  describe('Successful Creation', () => {
    it('should create a bucket with default settings', () => {
      const bucketName = generateBucketName('test')

      cy.get(selectors.nameInput)
        .clear()
        .type(bucketName)

      cy.get(selectors.submitButton).click()

      // Should show success toast
      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')
        .should('contain', bucketName)

      // Should redirect to list
      cy.url().should('include', '/object-storage')
      cy.url().should('not.include', '/create')

      // Verify bucket appears in list
      tableHelpers.waitForListReady()
      tableHelpers.searchAndSubmit(bucketName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', bucketName)
    })

    it('should create a bucket with Read Only access', () => {
      const bucketName = generateBucketName('readonly')

      cy.get(selectors.nameInput)
        .clear()
        .type(bucketName)

      // Select Read Only
      cy.get(selectors.edgeAccessDropdown).click()
      cy.get('.p-dropdown-panel', { timeout: 5000 }).should('be.visible')
      cy.get('.p-dropdown-item').contains('Read Only').click()

      cy.get(selectors.submitButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')
    })

    it('should create a bucket with Restricted access', () => {
      const bucketName = generateBucketName('restricted')

      cy.get(selectors.nameInput)
        .clear()
        .type(bucketName)

      // Select Restricted
      cy.get(selectors.edgeAccessDropdown).click()
      cy.get('.p-dropdown-panel', { timeout: 5000 }).should('be.visible')
      cy.get('.p-dropdown-item').contains('Restricted').click()

      cy.get(selectors.submitButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')
    })
  })

  describe('Validation Errors', () => {
    it('should show error for empty name', () => {
      cy.get(selectors.nameInput)
        .clear()
        .blur()

      cy.get(selectors.submitButton).click()

      cy.get('body').then(($body) => {
        if ($body.find('.p-error').length) {
          cy.get('.p-error').should('be.visible')
        } else {
          // Form should not submit, stay on page
          cy.url().should('include', '/object-storage/create')
        }
      })
    })
  })

  describe('Form Actions', () => {
    it('should cancel and return to list', () => {
      cy.get(selectors.nameInput).type('will-be-cancelled')

      cy.get(selectors.cancelButton).click()

      cy.url().should('include', '/object-storage')
      cy.url().should('not.include', '/create')
    })
  })
})
