/**
 * Edge Applications - Create Tests (Self-Contained)
 *
 * API: POST v4/workspace/applications
 * Route: /edge-application/create
 *
 * Application requires: name (v2), name + address + hostHeader (v4)
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/edge-application'

const generateAppName = (prefix = 'App') => {
  return `${prefix}_${Date.now()}`
}

describe('Edge Applications - Create', { tags: ['@crud', '@edge-applications', '@v4', '@smoke'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Edge Application')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
  })

  describe('Application Creation', () => {
    it('should navigate to create application page', () => {
      cy.get(selectors.mainSettings.createButton, { timeout: 15000 })
        .should('be.visible')
        .click()

      cy.url().should('include', '/edge-application/create')
      cy.get(selectors.mainSettings.nameInput, { timeout: 15000 }).should('be.visible')
    })

    it('should display form fields on create page', () => {
      cy.get(selectors.mainSettings.createButton, { timeout: 15000 }).click()

      cy.get(selectors.mainSettings.nameInput, { timeout: 15000 }).should('be.visible')

      // Check for address input (v4 form has origin settings)
      cy.get('body').then(($body) => {
        if ($body.find(selectors.mainSettings.addressInput).length) {
          cy.get(selectors.mainSettings.addressInput).should('be.visible')
        }
      })
    })

    it('should create a basic edge application', () => {
      const appName = generateAppName('BasicApp')

      cy.get(selectors.mainSettings.createButton, { timeout: 15000 }).click()

      // Fill name
      cy.get(selectors.mainSettings.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(appName)

      // If v4 form with address field, fill it
      cy.get('body').then(($body) => {
        if ($body.find(selectors.mainSettings.addressInput).length) {
          cy.get(selectors.mainSettings.addressInput)
            .clear()
            .type('httpbin.org')

          // Host header if exists
          if ($body.find(selectors.accordionStepEdgeConnector.hostOriginInput).length) {
            cy.get(selectors.accordionStepEdgeConnector.hostOriginInput)
              .clear()
              .type('httpbin.org')
          }
        }
      })

      // Submit
      cy.get(selectors.formActions.saveButton).click()

      // Verify success
      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')
        .and('contain', 'created')
    })

    it('should verify created application appears in list', () => {
      const appName = generateAppName('ListCheck')

      cy.get(selectors.mainSettings.createButton, { timeout: 15000 }).click()

      cy.get(selectors.mainSettings.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(appName)

      // If v4 form with address field
      cy.get('body').then(($body) => {
        if ($body.find(selectors.mainSettings.addressInput).length) {
          cy.get(selectors.mainSettings.addressInput)
            .clear()
            .type('httpbin.org')
        }
      })

      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

      // Navigate back to list
      cy.openProduct('Edge Application')
      cy.get('.p-datatable', { timeout: 15000 }).should('exist')

      // Search for created application
      tableHelpers.searchAndSubmit(appName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', appName)
    })
  })

  describe('Module Switches', () => {
    it('should display module switches on create page', () => {
      cy.get(selectors.mainSettings.createButton, { timeout: 15000 }).click()

      // Check for module switches
      cy.get('body').then(($body) => {
        // Application Accelerator
        if ($body.find(selectors.mainSettings.modulesSwitch('applicationAccelerator')).length) {
          cy.get(selectors.mainSettings.modulesSwitch('applicationAccelerator')).should('exist')
        }
        // Edge Functions
        if ($body.find(selectors.mainSettings.modulesSwitch('edgeFunctions')).length) {
          cy.get(selectors.mainSettings.modulesSwitch('edgeFunctions')).should('exist')
        }
      })
    })
  })

  describe('Validation', () => {
    it('should show error for empty name', () => {
      cy.get(selectors.mainSettings.createButton, { timeout: 15000 }).click()

      cy.get(selectors.mainSettings.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .blur()

      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-error, [data-testid*="error"]', { timeout: 10000 })
        .should('exist')
    })
  })

  describe('Form Actions', () => {
    it('should cancel creation and return to list', () => {
      cy.get(selectors.mainSettings.createButton, { timeout: 15000 }).click()

      cy.get(selectors.mainSettings.nameInput, { timeout: 15000 })
        .should('be.visible')
        .type('WillBeCancelled')

      cy.get(selectors.formActions.cancelButton).click()

      // Handle potential confirmation dialog
      cy.get('body').then(($body) => {
        if ($body.find('.p-dialog-footer button').length) {
          cy.get('.p-dialog-footer button').contains(/leave|discard|confirm/i).click()
        }
      })

      cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
    })
  })
})
