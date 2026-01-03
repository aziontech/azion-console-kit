/**
 * Digital Certificates - Read/List Tests (Self-Contained)
 *
 * API: GET v4/workspace/tls/certificates
 * Route: /digital-certificates, /digital-certificates/edit/:id
 *
 * Self-contained: Creates test data in before(), tests against it.
 * No cleanup needed - CI handles it or data can be reused.
 *
 * Note: Digital Certificates uses EmptyResultsBlock when no data exists.
 * Creates a Trusted CA certificate for testing (simplest form).
 *
 * Supports fixture recording:
 * - CYPRESS_TEST_MODE=record: Records API responses to fixtures
 * - CYPRESS_TEST_MODE=replay: Uses recorded fixtures
 * - CYPRESS_TEST_MODE=live: Uses real API (default)
 */

import { tableHelpers, fixtureRecorder } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/digital-certificates'

// Test data - created once, used by all tests in this spec
const testCertName = `cy-read-list-${Date.now()}`

// Sample self-signed CA certificate for testing (PEM format)
const testCertificate = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJAKHBfpB7AVJWMA0GCSqGSIb3DQEBCwUAMBExDzANBgNVBAMMBnRl
c3RjYTAeFw0yNDAxMDEwMDAwMDBaFw0yNTAxMDEwMDAwMDBaMBExDzANBgNVBAMM
BnRlc3RjYTBcMA0GCSqGSIb3DQEBAQUAA0sAMEgCQQC5hJCZ7pvMT0xkv2fNfx6h
lqkIHFgDqD+WxMxYRyZ1GFRKVdJrxPy0d2pFhCi9rBFkH7ePrFm0vcyB0R5wJFBn
AgMBAAGjUzBRMB0GA1UdDgQWBBQK8JKVFv7TUdYZJXvMrJB7P0ZnhzAfBgNVHSME
GDAWgBQK8JKVFv7TUdYZJXvMrJB7P0ZnhzAPBgNVHRMBAf8EBTADAQH/MA0GCSqG
SIb3DQEBCwUAA0EAUphFMUAjBD1nZ4fJ8Zpl7SXXf6xTzEKLBL7gH7VR7K+tG8Yv
7DPKZ+n7yP3l5L1s0hCDtEdLQOpUCVS8tQ7aEQ==
-----END CERTIFICATE-----`

// Helper to create a Trusted CA certificate for testing
const createTestCertificate = (name) => {
  cy.openProduct('Digital Certificates')
  cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

  // Click create menu button
  cy.get(selectors.createMenuButton).click()

  // Select "Trusted Certificate" from menu
  cy.get('[role="menuitem"]').contains(/trusted/i).click()

  // Fill name
  cy.get(selectors.form.nameInput, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(name)

  // Fill certificate
  cy.get(selectors.trustedCA.certificateTextarea, { timeout: 10000 })
    .should('be.visible')
    .type(testCertificate, { parseSpecialCharSequences: false })

  // Submit
  cy.get(selectors.formActions.saveButton).click()
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
}

describe('Digital Certificates - Read/List', { tags: ['@crud', '@digital-certificates', '@v4'] }, () => {
  before(() => {
    // Setup: Create test data once for all tests in this spec
    cy.login()
    createTestCertificate(testCertName)
  })

  beforeEach(() => {
    fixtureRecorder.setupSync('digitalCertificates', 'v4/workspace/tls/certificates')
    cy.login()
    cy.openProduct('Digital Certificates')
    // Wait for either table or EmptyResultsBlock
    tableHelpers.waitForListReady()
  })

  afterEach(() => {
    fixtureRecorder.saveRecordings()
  })

  describe('List View', () => {
    it('should display digital certificates page', () => {
      cy.get(selectors.createMenuButton, { timeout: 15000 }).should('be.visible')
    })

    it('should display Certificates/CRL toggle', () => {
      // SelectButton for switching between Certificates and CRL views
      cy.get('.p-selectbutton', { timeout: 15000 }).should('exist')
      cy.get('.p-selectbutton').contains('Certificates').should('exist')
      cy.get('.p-selectbutton').contains('CRL').should('exist')
    })

    it('should display table with correct columns', () => {
      cy.get('th').contains('Name').should('exist')
      cy.get('th').contains(/Type|ID|Status/i).should('exist')
    })

    it('should display certificate data in rows', () => {
      cy.get('[data-testid*="list-table-block__column__name"]').should('exist')
    })
  })

  describe('Search Functionality', () => {
    it('should have search input', () => {
      cy.get(selectors.searchInput, { timeout: 15000 }).should('exist')
    })

    it('should show no results for non-matching search', () => {
      tableHelpers.searchAndSubmit('NONEXISTENT_CERT_XYZ999')
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 10000 })
        .should('exist')
    })

    it('should filter certificates by search term', () => {
      tableHelpers.searchAndSubmit(testCertName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 10000 })
        .should('contain', testCertName)
    })
  })

  describe('View Toggle', () => {
    it('should switch to CRL view when clicking CRL button', () => {
      cy.get('.p-selectbutton button').contains('CRL').click()
      // Wait for view to update
      tableHelpers.waitForListReady()
    })

    it('should switch back to Certificates view', () => {
      cy.get('.p-selectbutton button').contains('Certificates').click()
      tableHelpers.waitForListReady()
    })
  })

  describe('Table Interactions', () => {
    it('should navigate to edit page when clicking a row', () => {
      tableHelpers.searchAndSubmit(testCertName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testCertName)
        .click()

      cy.url({ timeout: 15000 }).should('include', '/digital-certificates/edit/')
      cy.get(selectors.form.nameInput, { timeout: 15000 }).should('exist')
    })

    it('should show action button for each row', () => {
      cy.get('[data-testid*="actions"]').should('exist')
    })
  })

  describe('Detail View (Edit Page)', () => {
    it('should load certificate data for editing', () => {
      tableHelpers.searchAndSubmit(testCertName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testCertName)
        .click()

      cy.get(selectors.form.nameInput, { timeout: 15000 })
        .should('have.value', testCertName)
    })
  })
})
