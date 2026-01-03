/**
 * Profile Tests - V3 UI Behavior
 *
 * Tests specific behavior when account has V3 UI enabled:
 * - Flag: block_apiv4_incompatible_endpoints = true
 * - Uses legacy v3 API endpoints where available
 * - Legacy UI components and layouts
 *
 * Note: V3 UI is being phased out. These tests ensure backward compatibility
 * for accounts that still have the legacy flag enabled.
 */

import { profileHelpers, TEST_PROFILES } from '../../support/console-kit-helpers'

describe('V3 UI Profile Behavior', { tags: ['@profiles', '@v3-ui'] }, () => {
  beforeEach(() => {
    // Setup profile based on TEST_MODE:
    // - live: Uses real account with V3 UI flags (from GitHub secrets)
    // - mock/replay: Uses fixture to mock account info
    profileHelpers.setupProfile(TEST_PROFILES.V3_UI_V3_CONFIG)
  })

  describe('Edge Applications - V3 UI', () => {
    beforeEach(() => {
      // V3 UI may still call v4 endpoints for some modules
      // but may render different UI components
      cy.intercept('GET', '**/v4/workspace/applications*').as('listApps')
      cy.intercept('GET', '**/api/v3/edge_applications*').as('listAppsV3')

      cy.login()
    })

    it('should load edge applications page', () => {
      cy.openProduct('Edge Application')

      // Should load either v4 or v3 endpoint depending on implementation
      cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
    })

    it('should display create button', () => {
      cy.openProduct('Edge Application')
      cy.get('[data-testid="create_Application_button"]', { timeout: 15000 }).should('be.visible')
    })
  })

  describe('Variables - Always V3 API', () => {
    beforeEach(() => {
      // Variables always uses v3 API regardless of UI version
      cy.intercept('GET', '**/v3/variables*').as('listVariables')

      cy.login()
      cy.openProduct('Variables')
    })

    it('should use v3 API for variables', () => {
      cy.wait('@listVariables', { timeout: 15000 })
      cy.get('.p-datatable, [data-testid*="empty"]').should('exist')
    })

    it('should display key-value form', () => {
      cy.get('[data-testid="create_Variable_button"]').click()

      // Both V3 and V4 UI should have key-value inputs for variables
      cy.get('[data-testid="variables-form__key-field__input"]', { timeout: 15000 }).should(
        'be.visible'
      )
      cy.get('[data-testid="variables-form__value-field__input"]').should('be.visible')
    })
  })

  describe('Account Menu - V3 UI', () => {
    beforeEach(() => {
      cy.login()
    })

    it('should display account menu items', () => {
      // Click account menu (profile icon)
      cy.get('[data-testid*="profile"], [data-testid*="account-menu"]', { timeout: 15000 })
        .first()
        .click()

      // Should show standard menu items
      cy.get('[role="menu"], [role="menuitem"]', { timeout: 10000 }).should('exist')
    })

    it('should navigate to users management', () => {
      cy.visit('/users')
      cy.url().should('include', '/users')
      cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
    })
  })
})

describe('V3 vs V4 UI Differences', { tags: ['@profiles', '@comparison'] }, () => {
  describe('API Endpoint Selection', () => {
    it('should document modules that differ between V3 and V4', () => {
      // This test documents the expected behavior
      const moduleApiVersions = {
        // Modules that ALWAYS use V4 API (no V3 fallback)
        alwaysV4: [
          'Edge Functions',
          'Edge DNS',
          'Digital Certificates',
          'Data Stream',
          'Network Lists',
          'WAF Rules',
          'Edge SQL',
          'Edge Storage',
          'Credentials'
        ],

        // Modules that ALWAYS use V3 API
        alwaysV3: ['Variables'],

        // Modules that may use different endpoints based on UI version
        versionDependent: ['Edge Applications', 'Edge Firewall', 'Teams']
      }

      // Just log for documentation purposes
      cy.log('Always V4:', moduleApiVersions.alwaysV4.join(', '))
      cy.log('Always V3:', moduleApiVersions.alwaysV3.join(', '))
      cy.log('Version Dependent:', moduleApiVersions.versionDependent.join(', '))
    })
  })
})
