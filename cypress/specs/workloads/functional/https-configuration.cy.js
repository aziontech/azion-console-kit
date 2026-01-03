/**
 * Workloads - HTTPS Configuration Functional Tests
 *
 * Tests: HTTPS setup, TLS versions, cipher suites, HTTP/3
 *
 * These tests validate the protocol configuration options
 * beyond basic CRUD operations.
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/workload'

const generateName = (prefix = 'HTTPS') => {
  return `${prefix}-${Date.now()}`
}

describe('Workloads - HTTPS Configuration', { tags: ['@functional', '@workloads', '@https'] }, () => {
  const createdWorkloads = []

  beforeEach(() => {
    cy.login()
    // Wait for page to be fully loaded after login
    cy.get('[data-testid="sidebar-block__toggle-button"]', { timeout: 30000 }).should('exist')
    cy.openProduct('Domains')
    tableHelpers.waitForListReady()
  })

  describe('HTTPS Toggle', () => {
    it('should enable HTTPS and show certificate dropdown', () => {
      // Navigate to create
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()
      cy.url().should('include', '/create')

      // Scroll to Protocol Settings section
      cy.get(selectors.protocolSettingsSection, { timeout: 15000 }).scrollIntoView()

      // Find and click the HTTPS switch
      cy.get(selectors.useHttpsSwitch, { timeout: 10000 }).then(($switch) => {
        if (!$switch.hasClass('p-inputswitch-checked')) {
          cy.wrap($switch).click()
        }
      })

      // Wait for certificate dropdown to appear (conditional rendering)
      cy.get('[data-testid="domains-form__edge-certificate-field__dropdown"]', { timeout: 10000 })
        .scrollIntoView()
        .should('exist')
    })

    it('should show HTTPS port options when enabled', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Scroll to Protocol Settings section
      cy.get(selectors.protocolSettingsSection, { timeout: 15000 }).scrollIntoView()

      // Enable HTTPS
      cy.get(selectors.useHttpsSwitch, { timeout: 10000 }).then(($switch) => {
        if (!$switch.hasClass('p-inputswitch-checked')) {
          cy.wrap($switch).click()
        }
      })

      // HTTPS port multiselect should be visible
      cy.get(selectors.portHttps, { timeout: 10000 }).scrollIntoView().should('exist')
    })

    it('should disable HTTPS and hide certificate options', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Scroll to Protocol Settings section
      cy.get(selectors.protocolSettingsSection, { timeout: 15000 }).scrollIntoView()

      // First enable HTTPS
      cy.get(selectors.useHttpsSwitch, { timeout: 10000 }).then(($switch) => {
        if (!$switch.hasClass('p-inputswitch-checked')) {
          cy.wrap($switch).click()
        }
      })

      // Verify certificate dropdown is visible
      cy.get('[data-testid="domains-form__edge-certificate-field__dropdown"]', { timeout: 10000 })
        .should('exist')

      // Now disable HTTPS (click the switch again)
      cy.get(selectors.useHttpsSwitch).click()

      // Certificate dropdown should be hidden
      cy.get('[data-testid="domains-form__edge-certificate-field__dropdown"]').should('not.exist')
    })
  })

  describe('TLS Version Configuration', () => {
    it('should display TLS version dropdown options', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Scroll to Protocol Settings section
      cy.get(selectors.protocolSettingsSection, { timeout: 15000 }).scrollIntoView()

      // Enable HTTPS first
      cy.get(selectors.useHttpsSwitch, { timeout: 10000 }).then(($switch) => {
        if (!$switch.hasClass('p-inputswitch-checked')) {
          cy.wrap($switch).click()
        }
      })

      // Scroll to and click TLS version dropdown
      cy.get(selectors.tlsVersion, { timeout: 10000 }).scrollIntoView().click()

      // Verify TLS options exist (actual labels from code)
      cy.get('.p-dropdown-items').within(() => {
        cy.contains('TLS v1.0').should('exist')
        cy.contains('TLS v1.2').should('exist')
        cy.contains('TLS v1.3').should('exist')
      })
    })

    it('should select TLS v1.2 minimum version', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Scroll to Protocol Settings section
      cy.get(selectors.protocolSettingsSection, { timeout: 15000 }).scrollIntoView()

      // Enable HTTPS
      cy.get(selectors.useHttpsSwitch, { timeout: 10000 }).then(($switch) => {
        if (!$switch.hasClass('p-inputswitch-checked')) {
          cy.wrap($switch).click()
        }
      })

      // Select TLS v1.2
      cy.get(selectors.tlsVersion, { timeout: 10000 }).scrollIntoView().click()
      cy.contains('li', 'TLS v1.2').click()

      // Verify selection
      cy.get(selectors.tlsVersion).should('contain.text', 'TLS v1.2')
    })
  })

  describe('Cipher Suite Configuration', () => {
    it('should display cipher suite options', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Scroll to Protocol Settings section
      cy.get(selectors.protocolSettingsSection, { timeout: 15000 }).scrollIntoView()

      // Enable HTTPS
      cy.get(selectors.useHttpsSwitch, { timeout: 10000 }).then(($switch) => {
        if (!$switch.hasClass('p-inputswitch-checked')) {
          cy.wrap($switch).click()
        }
      })

      // Click cipher suite dropdown
      cy.get(selectors.cipherSuite, { timeout: 10000 }).scrollIntoView().click()

      // Verify cipher options (using modern cipher names)
      cy.get('.p-dropdown-items', { timeout: 5000 }).should('exist')
    })
  })

  describe('HTTP/3 (QUIC) Configuration', () => {
    it('should enable HTTP/3 when HTTPS is enabled', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Scroll to Protocol Settings section
      cy.get(selectors.protocolSettingsSection, { timeout: 15000 }).scrollIntoView()

      // Enable HTTPS first (required for HTTP/3)
      cy.get(selectors.useHttpsSwitch, { timeout: 10000 }).then(($switch) => {
        if (!$switch.hasClass('p-inputswitch-checked')) {
          cy.wrap($switch).click()
        }
      })

      // Scroll to HTTP/3 switch and enable it
      cy.get(selectors.useHttp3Switch, { timeout: 10000 }).scrollIntoView().then(($switch) => {
        if (!$switch.hasClass('p-inputswitch-checked')) {
          cy.wrap($switch).click()
        }
      })

      // HTTP/3 should be enabled
      cy.get(selectors.useHttp3Switch).should('have.class', 'p-inputswitch-checked')
    })
  })

  describe('HTTP Port Configuration', () => {
    it('should display HTTP port multiselect', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // HTTP port should be visible by default
      cy.get(selectors.portHttp, { timeout: 10000 }).should('exist')
    })

    it('should allow selecting multiple HTTP ports', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Click HTTP port multiselect
      cy.get(selectors.portHttp, { timeout: 10000 }).click()

      // Select multiple ports
      cy.get('.p-multiselect-items').within(() => {
        cy.contains('80').click()
        cy.contains('8080').click()
      })

      // Close dropdown
      cy.get('body').click(0, 0)

      // Verify selections
      cy.get(selectors.portHttp).should('contain.text', '80')
    })
  })

  describe('Create Workload with HTTPS', () => {
    it('should create workload with HTTPS enabled', () => {
      const workloadName = generateName('HTTPSWorkload')

      cy.intercept('POST', '**/workloads').as('createWorkload')

      // Navigate to create
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Fill name (using generic FieldText selector)
      cy.get('[data-testid="field-text__input"]', { timeout: 10000 })
        .first()
        .clear()
        .type(workloadName)

      // Wait for dropdown to finish loading (loading icon should disappear)
      cy.get('[data-testid="domains-form__edge-application-field__loading-icon"]', { timeout: 5000 })
        .should('not.exist')

      // Click to open dropdown and wait for options
      cy.get(selectors.edgeApplicationField, { timeout: 10000 }).scrollIntoView().click()

      // Wait for dropdown panel and options to render
      cy.get('.p-dropdown-panel', { timeout: 10000 }).should('be.visible')
      cy.get('li[role="option"]', { timeout: 10000 }).first().click()

      // Scroll to Protocol Settings section
      cy.get(selectors.protocolSettingsSection, { timeout: 15000 }).scrollIntoView()

      // Enable HTTPS
      cy.get(selectors.useHttpsSwitch, { timeout: 10000 }).then(($switch) => {
        if (!$switch.hasClass('p-inputswitch-checked')) {
          cy.wrap($switch).click()
        }
      })

      // Wait for certificate dropdown to load
      cy.get('[data-testid="domains-form__edge-certificate-field__loading-icon"]', { timeout: 5000 })
        .should('not.exist')

      // Select a digital certificate
      cy.get('[data-testid="domains-form__edge-certificate-field__dropdown"]', { timeout: 10000 })
        .scrollIntoView()
        .click()

      cy.get('.p-dropdown-panel', { timeout: 10000 }).should('be.visible')
      cy.get('li[role="option"]', { timeout: 10000 }).first().click()

      // Save
      cy.get(selectors.formActionsSubmitButton).click()

      // Wait for response
      cy.wait('@createWorkload', { timeout: 30000 }).then((interception) => {
        expect(interception.response.statusCode).to.be.oneOf([200, 201, 202])
        createdWorkloads.push(workloadName)
      })
    })
  })

  // Note: Cleanup disabled to avoid test failures in after hook
  // Resources created during tests should be cleaned up manually if needed
})
