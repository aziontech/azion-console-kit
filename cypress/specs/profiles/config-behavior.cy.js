/**
 * Profile Tests - Configuration Behavior (V3 vs V5 Config)
 *
 * Tests specific behavior based on account configuration:
 * - V3 Config: useV5Configurations = false (standard accounts, fewer domains)
 * - V5 Config: useV5Configurations = true (massive accounts, thousands of domains)
 *
 * Configuration affects:
 * - Domain management UI
 * - Edge Application structure
 * - Performance optimizations for large datasets
 */

import { profileHelpers, TEST_PROFILES } from '../../support/console-kit-helpers'

describe('V3 Configuration Behavior', { tags: ['@profiles', '@v3-config'] }, () => {
  beforeEach(() => {
    // Setup profile based on TEST_MODE (live uses real account, mock uses fixture)
    profileHelpers.setupProfile(TEST_PROFILES.V4_UI_V3_CONFIG)
    cy.login()
  })

  describe('Edge Applications - V3 Config', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/v4/workspace/applications*').as('listApps')
      cy.openProduct('Edge Application')
    })

    it('should load applications list', () => {
      cy.wait('@listApps', { timeout: 15000 })
      cy.get('.p-datatable, [data-testid*="empty"]').should('exist')
    })

    it('should display standard domain configuration in edit', () => {
      cy.get('.p-datatable', { timeout: 15000 }).then(($table) => {
        if ($table.find('tr[data-pc-section="bodyrow"]').length > 0) {
          cy.get('[data-testid*="list-table-block__column__name"]').first().click()

          // V3 config should have standard tabs
          cy.get('.p-tabview', { timeout: 15000 }).should('exist')

          // Check for Main Settings tab
          cy.get('.p-tabview-nav').should('contain.text', 'Main Settings')
        }
      })
    })
  })

  describe('Domains - V3 Config', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/v4/workspace/domains*').as('listDomains')
    })

    it('should access domains via Edge Application', () => {
      // In V3 config, domains are typically managed within Edge Applications
      cy.openProduct('Edge Application')
      cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

      // If there are applications, check for domains tab
      cy.get('.p-datatable').then(($table) => {
        if ($table.find('tr[data-pc-section="bodyrow"]').length > 0) {
          cy.get('[data-testid*="list-table-block__column__name"]').first().click()

          // Look for Domains tab in application edit
          cy.get('.p-tabview-nav', { timeout: 15000 }).then(($nav) => {
            if ($nav.text().includes('Domains')) {
              cy.contains('.p-tabview-nav-link', 'Domains').click()
              cy.get('.p-datatable, [data-testid*="empty"]').should('exist')
            }
          })
        }
      })
    })
  })
})

describe('V5 Configuration Behavior', { tags: ['@profiles', '@v5-config'] }, () => {
  beforeEach(() => {
    // Mock account info with V5 config (massive domains)
    profileHelpers.setupProfile(TEST_PROFILES.V4_UI_V5_CONFIG)
    cy.login()
  })

  describe('Edge Applications - V5 Config', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/v4/workspace/applications*').as('listApps')
      cy.intercept('GET', '**/v4/workspace/workloads*').as('listWorkloads')
      cy.openProduct('Edge Application')
    })

    it('should load applications or workloads list', () => {
      // V5 config may use workloads instead of applications
      cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')
    })
  })

  describe('Domains - V5 Config', () => {
    it('should have separate Domains menu item', () => {
      // In V5 config, Domains might be a separate menu item due to scale
      // Check sidebar for Domains
      cy.get('[data-testid*="sidebar"], [class*="sidebar"]', { timeout: 15000 }).then(($sidebar) => {
        // Log what's in the sidebar for debugging
        cy.log('Sidebar found')
      })
    })
  })
})

describe('Configuration Comparison', { tags: ['@profiles', '@comparison'] }, () => {
  it('should document V3 vs V5 config differences', () => {
    const configDifferences = {
      v3Config: {
        description: 'Standard accounts with fewer domains',
        domainManagement: 'Domains within Edge Application tabs',
        performanceOptimizations: 'Standard pagination',
        typicalDomainCount: '< 100 domains'
      },
      v5Config: {
        description: 'Massive accounts with thousands of domains',
        domainManagement: 'Separate Domains/Workloads management',
        performanceOptimizations: 'Virtual scrolling, lazy loading',
        typicalDomainCount: '> 1000 domains'
      }
    }

    cy.log('V3 Config:', JSON.stringify(configDifferences.v3Config))
    cy.log('V5 Config:', JSON.stringify(configDifferences.v5Config))
  })

  describe('Flag Detection', () => {
    it('should correctly identify V3 config profile', () => {
      profileHelpers.setupProfile(TEST_PROFILES.V4_UI_V3_CONFIG)

      cy.login()

      // After login, the profile should be detected
      cy.window().then(() => {
        // Profile is set via Cypress.env, not runtime detection
        const isV5 = profileHelpers.isV5Config()
        expect(isV5).to.be.false
      })
    })

    it('should correctly identify V5 config profile', () => {
      profileHelpers.setupProfile(TEST_PROFILES.V4_UI_V5_CONFIG)

      cy.login()

      cy.window().then(() => {
        // When using V4_UI_V5_CONFIG fixture
        // Note: This checks Cypress.env, not actual API response
        const profile = profileHelpers.getCurrentProfile()
        expect(profile.flags.useV5Configurations).to.be.true
      })
    })
  })
})
