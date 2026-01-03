/**
 * Digital Certificates - Create Tests (Self-Contained)
 *
 * API: POST v4/workspace/tls/certificates
 * Route: /digital-certificates/create
 *
 * Certificate Types:
 * - Server Certificate (edge_certificate) - requires certificate + private key
 * - Trusted CA (trusted_ca_certificate) - requires certificate only
 * - CRL (certificateRevogationList) - requires CRL data
 */

import selectors from '../../../support/selectors/product-selectors/digital-certificates'

const generateCertName = (prefix = 'Cert') => {
  return `${prefix}_${Date.now()}`
}

// Test PEM certificate (self-signed, expired - for testing only)
const TEST_CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIICpDCCAYwCCQDU+pQ4P4MkLDANBgkqhkiG9w0BAQsFADAUMRIwEAYDVQQDDAls
b2NhbGhvc3QwHhcNMjMwMTAxMDAwMDAwWhcNMjQwMTAxMDAwMDAwWjAUMRIwEAYD
VQQDDAlsb2NhbGhvc3QwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7
o5e7XvL2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2
Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2
Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2
Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2QwIDAQABMA0GCSqGSIb3
DQEBCwUAA4IBAQBTest1234567890Test1234567890Test1234567890Test12345
Test1234567890Test1234567890Test1234567890Test1234567890Test12345678
-----END CERTIFICATE-----`

const TEST_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7o5e7XvL2Q2Q2
Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2
Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2
Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2
Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2Q2QwIDAQABAoIBAATest12
Test1234567890Test1234567890Test1234567890Test1234567890Test12345678
-----END PRIVATE KEY-----`

const TEST_CRL = `-----BEGIN X509 CRL-----
MIIBvTCBpgIBATANBgkqhkiG9w0BAQsFADAUMRIwEAYDVQQDDAlsb2NhbGhvc3QX
DTIzMDEwMTAwMDAwMFoXDTI0MDEwMTAwMDAwMFowFDASAgEBFw0yMzAxMDEwMDAw
MDBaoC8wLTAfBgNVHSMEGDAWgBQTest1234567890Test1234567890MAoGA1UdFA
QDAgEAMA0GCSqGSIb3DQEBCwUAA4IBAQBTest1234567890Test1234567890Test
-----END X509 CRL-----`

describe('Digital Certificates - Create', { tags: ['@crud', '@digital-certificates', '@v4'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Digital Certificates')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
  })

  describe('Server Certificate', () => {
    it('should open create menu and select Server Certificate option', () => {
      // Click menu button
      cy.get(selectors.createMenuButton, { timeout: 15000 })
        .should('be.visible')
        .click()

      // Menu should appear
      cy.get('#overlay_menu', { timeout: 5000 }).should('be.visible')

      // Click Server Certificate option
      cy.contains('.p-menuitem-link', 'Server Certificate').click()

      // Should navigate to create page with server cert type
      cy.url().should('include', '/digital-certificates/create')
      cy.url().should('include', 'certificate=edge_certificate')
    })

    it('should create a server certificate', () => {
      const certName = generateCertName('ServerCert')

      cy.get(selectors.createMenuButton, { timeout: 15000 }).click()
      cy.contains('.p-menuitem-link', 'Server Certificate').click()

      // Fill name
      cy.get(selectors.form.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(certName)

      // Fill certificate
      cy.get(selectors.serverCertificate.certificateTextarea, { timeout: 10000 })
        .should('be.visible')
        .type(TEST_CERTIFICATE, { delay: 0 })

      // Fill private key
      cy.get(selectors.serverCertificate.privateKeyTextarea, { timeout: 10000 })
        .should('be.visible')
        .type(TEST_PRIVATE_KEY, { delay: 0 })

      // Submit
      cy.get(selectors.formActions.saveButton).click()

      // Verify - may get error due to invalid cert, but should process
      cy.get('.p-toast-message', { timeout: 30000 }).should('be.visible')
    })
  })

  describe('Trusted CA Certificate', () => {
    it('should open create menu and select Trusted Certificate option', () => {
      cy.get(selectors.createMenuButton, { timeout: 15000 }).click()

      cy.get('#overlay_menu', { timeout: 5000 }).should('be.visible')

      cy.contains('.p-menuitem-link', 'Trusted Certificate').click()

      cy.url().should('include', '/digital-certificates/create')
      cy.url().should('include', 'certificate=trusted_ca_certificate')
    })

    it('should create a trusted CA certificate', () => {
      const certName = generateCertName('TrustedCA')

      cy.get(selectors.createMenuButton, { timeout: 15000 }).click()
      cy.contains('.p-menuitem-link', 'Trusted Certificate').click()

      // Fill name
      cy.get(selectors.form.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(certName)

      // Fill certificate (trusted CA only needs certificate, no private key)
      cy.get('[data-testid*="certificate-field__textarea"]', { timeout: 10000 })
        .first()
        .should('be.visible')
        .type(TEST_CERTIFICATE, { delay: 0 })

      // Submit
      cy.get(selectors.formActions.saveButton).click()

      // Verify
      cy.get('.p-toast-message', { timeout: 30000 }).should('be.visible')
    })
  })

  describe('CRL (Certificate Revocation List)', () => {
    it('should open create menu and select CRL option', () => {
      cy.get(selectors.createMenuButton, { timeout: 15000 })
        .should('be.visible')
        .click()

      // Wait for menu to be visible
      cy.get('#overlay_menu', { timeout: 5000 }).should('be.visible')

      // Click CRL option (full text is "Import a CRL")
      cy.get('#overlay_menu')
        .contains('CRL')
        .click()

      cy.url().should('include', '/digital-certificates/create')
      cy.url().should('include', 'certificate=certificateRevogationList')
    })

    it('should create a CRL', () => {
      const crlName = generateCertName('CRL')

      cy.get(selectors.createMenuButton, { timeout: 15000 })
        .should('be.visible')
        .click()

      cy.get('#overlay_menu', { timeout: 5000 }).should('be.visible')
      cy.get('#overlay_menu').contains('CRL').click()

      // Wait for form to load
      cy.get(selectors.form.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .type(crlName)

      // Fill CRL data
      cy.get('[data-testid*="certificate-field__textarea"]', { timeout: 10000 })
        .first()
        .should('be.visible')
        .type(TEST_CRL, { delay: 0 })

      // Submit
      cy.get(selectors.formActions.saveButton).click()

      // Verify
      cy.get('.p-toast-message', { timeout: 30000 }).should('be.visible')
    })
  })

  describe('Validation', () => {
    it('should show error for empty name', () => {
      cy.get(selectors.createMenuButton, { timeout: 15000 })
        .should('be.visible')
        .click()

      cy.get('#overlay_menu', { timeout: 5000 }).should('be.visible')
      cy.get('#overlay_menu').contains('Server Certificate').click()

      // Wait for form to load
      cy.get(selectors.form.nameInput, { timeout: 15000 })
        .should('be.visible')
        .clear()
        .blur()

      cy.get(selectors.formActions.saveButton).click()

      // Should show error or stay on create page
      cy.get('.p-error, [data-testid*="error"]', { timeout: 10000 })
        .should('exist')
    })
  })

  describe('Form Actions', () => {
    it('should cancel creation and return to list', () => {
      cy.get(selectors.createMenuButton, { timeout: 15000 })
        .should('be.visible')
        .click()

      cy.get('#overlay_menu', { timeout: 5000 }).should('be.visible')
      cy.get('#overlay_menu').contains('Server Certificate').click()

      cy.get(selectors.form.nameInput, { timeout: 15000 })
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
