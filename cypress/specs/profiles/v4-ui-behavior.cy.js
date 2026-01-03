/**
 * Profile Tests - V4 UI Behavior
 *
 * Tests specific behavior when account has V4 UI enabled:
 * - Flag: block_apiv4_incompatible_endpoints = false
 * - Uses modern v4 workspace API endpoints
 * - Modern UI components and layouts
 *
 * These tests mock the account/info response to simulate V4 UI profile.
 */

import { profileHelpers, TEST_PROFILES } from '../../support/console-kit-helpers'

describe('V4 UI Profile Behavior', { tags: ['@profiles', '@v4-ui'] }, () => {
  beforeEach(() => {
    // Setup profile based on TEST_MODE:
    // - live: Uses real account with V4 UI flags (from GitHub secrets)
    // - mock/replay: Uses fixture to mock account info
    profileHelpers.setupProfile(TEST_PROFILES.V4_UI_V3_CONFIG)
  })

  describe('Edge Applications - V4 UI', () => {
    beforeEach(() => {
      // Intercept v4 API endpoints
      cy.intercept('GET', '**/v4/workspace/applications*').as('listAppsV4')

      cy.login()
      cy.openProduct('Edge Application')
    })

    it('should use v4 workspace API for listing', () => {
      // V4 UI should call v4/workspace/applications
      cy.wait('@listAppsV4', { timeout: 15000 })
      cy.get('.p-datatable, [data-testid*="empty"]').should('exist')
    })

    it('should display modern create button', () => {
      cy.get('[data-testid="create_Application_button"]', { timeout: 15000 }).should('be.visible')
    })

    it('should have tabbed interface in edit page', () => {
      cy.get('.p-datatable', { timeout: 15000 }).then(($table) => {
        if ($table.find('tr[data-pc-section="bodyrow"]').length > 0) {
          // Click first row
          cy.get('[data-testid*="list-table-block__column__name"]').first().click()

          // V4 UI should have tabview
          cy.get('.p-tabview', { timeout: 15000 }).should('exist')
        }
      })
    })
  })

  describe('Edge Functions - V4 UI', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/v4/workspace/functions*').as('listFunctionsV4')

      cy.login()
      cy.openProduct('Edge Functions')
    })

    it('should use v4 workspace API', () => {
      cy.wait('@listFunctionsV4', { timeout: 15000 })
      cy.get('.p-datatable, [data-testid*="empty"]').should('exist')
    })

    it('should display code editor in create form', () => {
      cy.get('[data-testid="create_Function_button"]').click()

      // V4 UI should have Monaco editor
      cy.get('.monaco-editor, [data-testid*="code-editor"]', { timeout: 15000 }).should('exist')
    })
  })

  describe('Edge Firewall - V4 UI', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/v4/workspace/firewalls*').as('listFirewallsV4')

      cy.login()
      cy.openProduct('Edge Firewall')
    })

    it('should use v4 workspace API', () => {
      cy.wait('@listFirewallsV4', { timeout: 15000 })
      cy.get('.p-datatable, [data-testid*="empty"]').should('exist')
    })

    it('should display modules toggle in edit page', () => {
      cy.get('.p-datatable', { timeout: 15000 }).then(($table) => {
        if ($table.find('tr[data-pc-section="bodyrow"]').length > 0) {
          cy.get('[data-testid*="list-table-block__column__name"]').first().click()

          // V4 UI should have module toggles (Edge Functions, WAF, etc)
          cy.get('.p-tabview', { timeout: 15000 }).should('exist')
        }
      })
    })
  })

  describe('Navigation - V4 UI', () => {
    beforeEach(() => {
      cy.login()
    })

    it('should display modern sidebar menu', () => {
      // V4 UI has collapsible sidebar
      cy.get('[data-testid*="sidebar"], [class*="sidebar"]', { timeout: 15000 }).should('exist')
    })

    it('should have breadcrumb navigation', () => {
      cy.openProduct('Edge Functions')
      cy.get('[data-testid="create_Function_button"]').click()

      // Breadcrumb should show path
      cy.get('[class*="breadcrumb"], [data-testid*="breadcrumb"]', { timeout: 10000 }).should(
        'exist'
      )
    })
  })
})
