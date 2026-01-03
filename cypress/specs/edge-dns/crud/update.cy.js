/**
 * Edge DNS - Update Tests (Self-Contained)
 *
 * API: PUT/PATCH v4/workspace/dns/zones/:id
 * Route: /edge-dns/edit/:id
 *
 * Tests update operations on zones and records
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/edge-dns'

const generateZoneName = (prefix = 'Zone') => {
  return `${prefix}_${Date.now()}`
}

const generateDomain = (prefix = 'test') => {
  return `${prefix}${Date.now()}.example.com`
}

describe('Edge DNS - Update', { tags: ['@crud', '@edge-dns', '@v4', '@smoke'] }, () => {
  let testZoneName
  let testDomain

  before(() => {
    // Create a zone to use for update tests
    testZoneName = generateZoneName('UpdateTest')
    testDomain = generateDomain('updatetest')

    cy.login()
    cy.openProduct('Edge DNS')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

    cy.get(selectors.createButton, { timeout: 15000 }).click()

    cy.get(selectors.form.nameInput, { timeout: 15000 })
      .should('be.visible')
      .clear()
      .type(testZoneName)

    cy.get(selectors.form.domainInput, { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type(testDomain)

    cy.get(selectors.formActions.saveButton).click()

    cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
  })

  beforeEach(() => {
    cy.login()
    cy.openProduct('Edge DNS')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
  })

  describe('Zone Update', () => {
    it('should navigate to edit page for existing zone', () => {
      tableHelpers.searchAndSubmit(testZoneName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testZoneName)
        .click()

      cy.url({ timeout: 15000 }).should('include', '/edge-dns/edit/')
      cy.get(selectors.form.nameInput, { timeout: 15000 }).should('be.visible')
    })

    it('should load zone data in edit form', () => {
      tableHelpers.searchAndSubmit(testZoneName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testZoneName)
        .click()

      cy.get(selectors.form.nameInput, { timeout: 15000 })
        .should('have.value', testZoneName)
    })

    it('should update zone name', () => {
      const newName = `${testZoneName}_Updated`

      tableHelpers.searchAndSubmit(testZoneName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testZoneName)
        .click()

      cy.get(selectors.form.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(newName)

      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')

      // Update test zone name for subsequent tests
      testZoneName = newName
    })

    it('should toggle zone status', () => {
      tableHelpers.searchAndSubmit(testZoneName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testZoneName)
        .click()

      // Check if status switch exists and toggle it
      cy.get('body').then(($body) => {
        if ($body.find(selectors.form.statusSwitch).length) {
          cy.get(selectors.form.statusSwitch).click()
          cy.get(selectors.formActions.saveButton).click()
          cy.get('.p-toast-message', { timeout: 30000 }).should('be.visible')
        }
      })
    })
  })

  describe('Records Tab', () => {
    it('should display Records tab in edit view', () => {
      tableHelpers.searchAndSubmit(testZoneName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testZoneName)
        .click()

      cy.get('.p-tabview-nav', { timeout: 15000 }).should('exist')
      cy.get(selectors.records.tab, { timeout: 10000 }).should('exist')
    })

    it('should navigate to Records tab', () => {
      tableHelpers.searchAndSubmit(testZoneName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testZoneName)
        .click()

      cy.get(selectors.records.tab, { timeout: 15000 }).click()

      // Should see records table or empty state
      cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 15000 }).should('exist')
    })

    it('should show create record button in Records tab', () => {
      tableHelpers.searchAndSubmit(testZoneName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testZoneName)
        .click()

      cy.get(selectors.records.tab, { timeout: 15000 }).click()

      cy.get(selectors.records.createButton, { timeout: 15000 }).should('be.visible')
    })

    it('should create a DNS record', () => {
      const recordName = `record_${Date.now()}`

      tableHelpers.searchAndSubmit(testZoneName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testZoneName)
        .click()

      cy.get(selectors.records.tab, { timeout: 15000 }).click()
      cy.get(selectors.records.createButton, { timeout: 15000 }).click()

      // Fill record form
      cy.get(selectors.records.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(recordName)

      // Select record type (default is usually A)
      cy.get(selectors.records.recordTypeDropdown, { timeout: 10000 }).then(($dropdown) => {
        if ($dropdown.is(':visible')) {
          cy.wrap($dropdown).click()
          cy.get(selectors.records.recordTypeOption('A'), { timeout: 5000 }).click()
        }
      })

      // Fill TTL
      cy.get(selectors.records.ttlInput, { timeout: 10000 }).then(($ttl) => {
        if ($ttl.is(':visible')) {
          cy.wrap($ttl).clear().type('3600')
        }
      })

      // Fill value (IP address for A record)
      cy.get(selectors.records.valueTextarea, { timeout: 10000 })
        .should('be.visible')
        .type('192.168.1.1')

      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-toast-message', { timeout: 30000 }).should('be.visible')
    })
  })

  describe('Validation on Update', () => {
    it('should show error when clearing required name field', () => {
      tableHelpers.searchAndSubmit(testZoneName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testZoneName)
        .click()

      cy.get(selectors.form.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .blur()

      cy.get(selectors.formActions.saveButton).click()

      cy.get('.p-error, [data-testid*="error"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Cancel Update', () => {
    it('should discard changes on cancel', () => {
      const originalName = testZoneName

      tableHelpers.searchAndSubmit(testZoneName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .contains(testZoneName)
        .click()

      cy.get(selectors.form.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type('WillBeCancelled')

      cy.get(selectors.formActions.cancelButton).click()

      // Handle potential confirmation dialog
      cy.get('body').then(($body) => {
        if ($body.find('.p-dialog-footer button').length) {
          cy.get('.p-dialog-footer button').contains(/leave|discard|confirm/i).click()
        }
      })

      cy.get('.p-datatable', { timeout: 30000 }).should('exist')

      // Verify original zone still exists with original name
      tableHelpers.searchAndSubmit(originalName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', originalName)
    })
  })
})
