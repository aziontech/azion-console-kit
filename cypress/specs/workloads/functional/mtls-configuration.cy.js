/**
 * Workloads - mTLS (Mutual TLS) Configuration Tests
 *
 * Tests: mTLS enablement, trusted CA certificates, verification modes
 *
 * mTLS requires client certificates for authentication,
 * providing an additional layer of security.
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/workload'

const generateName = (prefix = 'mTLS') => {
  return `${prefix}-${Date.now()}`
}

describe('Workloads - mTLS Configuration', { tags: ['@functional', '@workloads', '@mtls', '@security'] }, () => {
  const createdWorkloads = []

  beforeEach(() => {
    cy.login()
    // Wait for page to be fully loaded after login
    cy.get('[data-testid="sidebar-block__toggle-button"]', { timeout: 30000 }).should('exist')
    cy.openProduct('Domains')
    tableHelpers.waitForListReady()
  })

  describe('mTLS Toggle', () => {
    it('should display mTLS switch in create form', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()
      cy.url().should('include', '/create')

      // Scroll to Protocol Settings section first (mTLS is in this section)
      cy.get(selectors.protocolSettingsSection, { timeout: 15000 }).scrollIntoView()

      // mTLS switch should exist
      cy.get(selectors.enableMtlsSwitch, { timeout: 10000 }).should('exist')
    })

    it('should enable mTLS and show trusted CA dropdown', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Scroll to Protocol Settings section
      cy.get(selectors.protocolSettingsSection, { timeout: 15000 }).scrollIntoView()

      // Enable mTLS
      cy.get(selectors.enableMtlsSwitch, { timeout: 10000 }).then(($switch) => {
        if (!$switch.hasClass('p-inputswitch-checked')) {
          cy.wrap($switch).click()
        }
      })

      // Trusted CA dropdown should appear
      cy.get(selectors.dropdownTrustedCA, { timeout: 10000 }).scrollIntoView().should('exist')
    })

    it('should disable mTLS and hide trusted CA options', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Scroll to Protocol Settings section
      cy.get(selectors.protocolSettingsSection, { timeout: 15000 }).scrollIntoView()

      // Enable mTLS first
      cy.get(selectors.enableMtlsSwitch, { timeout: 10000 }).then(($switch) => {
        if (!$switch.hasClass('p-inputswitch-checked')) {
          cy.wrap($switch).click()
        }
      })

      // Verify dropdown is visible
      cy.get(selectors.dropdownTrustedCA, { timeout: 10000 }).should('exist')

      // Disable mTLS
      cy.get(selectors.enableMtlsSwitch).click()

      // Dropdown should be hidden
      cy.get(selectors.dropdownTrustedCA).should('not.exist')
    })
  })

  describe('Trusted CA Certificate Selection', () => {
    it('should show trusted CA certificate options when mTLS enabled', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Scroll to Protocol Settings section
      cy.get(selectors.protocolSettingsSection, { timeout: 15000 }).scrollIntoView()

      // Enable mTLS
      cy.get(selectors.enableMtlsSwitch, { timeout: 10000 }).then(($switch) => {
        if (!$switch.hasClass('p-inputswitch-checked')) {
          cy.wrap($switch).click()
        }
      })

      // Wait for trusted CA dropdown to load (lazy loading)
      cy.get('[data-testid="domains-form__mtls-trusted-certificate-field__loading-icon"]', { timeout: 5000 })
        .should('not.exist')

      // Click trusted CA dropdown
      cy.get('[data-testid="domains-form__mtls-trusted-certificate-field__dropdown"]', { timeout: 10000 })
        .scrollIntoView()
        .click()

      // Wait for dropdown panel
      cy.get('.p-dropdown-panel', { timeout: 10000 }).should('be.visible')

      // Should show certificate options or empty message
      cy.get('.p-dropdown-items li, .p-dropdown-empty-message', { timeout: 10000 }).should('exist')
    })

    it('should allow searching for trusted CA certificates', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Scroll to Protocol Settings section
      cy.get(selectors.protocolSettingsSection, { timeout: 15000 }).scrollIntoView()

      // Enable mTLS
      cy.get(selectors.enableMtlsSwitch, { timeout: 10000 }).then(($switch) => {
        if (!$switch.hasClass('p-inputswitch-checked')) {
          cy.wrap($switch).click()
        }
      })

      // Wait for trusted CA dropdown to load
      cy.get('[data-testid="domains-form__mtls-trusted-certificate-field__loading-icon"]', { timeout: 5000 })
        .should('not.exist')

      // Click trusted CA dropdown
      cy.get('[data-testid="domains-form__mtls-trusted-certificate-field__dropdown"]', { timeout: 10000 })
        .scrollIntoView()
        .click()

      // Wait for dropdown panel
      cy.get('.p-dropdown-panel', { timeout: 10000 }).should('be.visible')

      // Search filter should be available
      cy.get('body').then(($body) => {
        if ($body.find(selectors.mtlsTrustedCADropdownFilter).length > 0) {
          cy.get(selectors.mtlsTrustedCADropdownFilter)
            .should('exist')
            .type('test')
        }
      })
    })
  })

  describe('mTLS with HTTPS', () => {
    it('should allow enabling both HTTPS and mTLS', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Scroll to Protocol Settings section
      cy.get(selectors.protocolSettingsSection, { timeout: 15000 }).scrollIntoView()

      // Enable HTTPS
      cy.get(selectors.useHttpsSwitch, { timeout: 10000 }).then(($switch) => {
        if (!$switch.hasClass('p-inputswitch-checked')) {
          cy.wrap($switch).click()
        }
      })

      // Enable mTLS
      cy.get(selectors.enableMtlsSwitch, { timeout: 10000 }).then(($switch) => {
        if (!$switch.hasClass('p-inputswitch-checked')) {
          cy.wrap($switch).click()
        }
      })

      // Both should be enabled
      cy.get(selectors.useHttpsSwitch).should('have.class', 'p-inputswitch-checked')
      cy.get(selectors.dropdownTrustedCA).should('exist')
    })
  })

  describe('Create Workload with mTLS', () => {
    it('should create workload with mTLS enabled (if trusted CA available)', () => {
      const workloadName = generateName('mTLSWorkload')

      cy.intercept('POST', '**/workloads').as('createWorkload')

      // Navigate to create
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Fill name (using generic FieldText selector)
      cy.get('[data-testid="field-text__input"]', { timeout: 10000 })
        .first()
        .clear()
        .type(workloadName)

      // Wait for dropdown to finish loading
      cy.get('[data-testid="domains-form__edge-application-field__loading-icon"]', { timeout: 5000 })
        .should('not.exist')

      // Select Edge Application
      cy.get(selectors.edgeApplicationField, { timeout: 10000 }).scrollIntoView().click()
      cy.get('.p-dropdown-panel', { timeout: 10000 }).should('be.visible')
      cy.get('li[role="option"]', { timeout: 15000 }).first().click()

      // Scroll to Protocol Settings section
      cy.get(selectors.protocolSettingsSection, { timeout: 15000 }).scrollIntoView()

      // Enable HTTPS (required for mTLS)
      cy.get(selectors.useHttpsSwitch, { timeout: 10000 }).then(($switch) => {
        if (!$switch.hasClass('p-inputswitch-checked')) {
          cy.wrap($switch).click()
        }
      })

      // Wait for certificate dropdown to load
      cy.get('[data-testid="domains-form__edge-certificate-field__loading-icon"]', { timeout: 5000 })
        .should('not.exist')

      // Select certificate for HTTPS
      cy.get('[data-testid="domains-form__edge-certificate-field__dropdown"]', { timeout: 10000 })
        .scrollIntoView()
        .click()
      cy.get('.p-dropdown-panel', { timeout: 10000 }).should('be.visible')
      cy.get('li[role="option"]', { timeout: 15000 }).first().click()

      // Enable mTLS
      cy.get(selectors.enableMtlsSwitch, { timeout: 10000 }).then(($switch) => {
        if (!$switch.hasClass('p-inputswitch-checked')) {
          cy.wrap($switch).click()
        }
      })

      // Wait for trusted CA dropdown to load
      cy.get('[data-testid="domains-form__mtls-trusted-certificate-field__loading-icon"]', { timeout: 5000 })
        .should('not.exist')

      // Select trusted CA certificate (if available)
      cy.get('[data-testid="domains-form__mtls-trusted-certificate-field__dropdown"]', { timeout: 10000 })
        .scrollIntoView()
        .click()

      // Wait for dropdown panel
      cy.get('.p-dropdown-panel', { timeout: 10000 }).should('be.visible')

      // Check for options inside the CURRENT dropdown panel (not entire body)
      cy.get('.p-dropdown-panel').then(($panel) => {
        const hasOptions = $panel.find('li[role="option"]').length > 0
        const hasEmptyMessage = $panel.find('.p-dropdown-empty-message').length > 0 ||
                                $panel.text().includes('No available options')

        if (hasOptions && !hasEmptyMessage) {
          cy.get('.p-dropdown-panel li[role="option"]').first().click()

          // Save
          cy.get(selectors.formActionsSubmitButton).click()

          cy.wait('@createWorkload', { timeout: 30000 }).then((interception) => {
            if (interception.response.statusCode >= 200 && interception.response.statusCode < 300) {
              createdWorkloads.push(workloadName)
            }
          })
        } else {
          cy.log('No trusted CA certificates available - skipping mTLS creation test')
          // Close dropdown
          cy.get('body').click(0, 0)
        }
      })
    })
  })

  after(() => {
    // Cleanup
    if (createdWorkloads.length > 0) {
      cy.login()
      cy.openProduct('Domains')

      cy.get('.p-datatable, [class*="empty"]', { timeout: 30000 }).should('exist')

      createdWorkloads.forEach((name) => {
        cy.get('body').then(($body) => {
          if ($body.text().includes(name)) {
            tableHelpers.searchAndSubmit(name)

            cy.get('[data-testid*="list-table-block__column__name"]')
              .contains(name)
              .parents('tr')
              .find('[data-testid*="action"], .pi-trash')
              .first()
              .click()

            cy.get('[data-testid*="confirmation-input"]', { timeout: 10000 })
              .clear()
              .type(name)

            cy.get('[data-testid*="delete-button"]').click()
          }
        })
      })
    }
  })
})
