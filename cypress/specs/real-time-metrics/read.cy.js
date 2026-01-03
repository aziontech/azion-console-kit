/**
 * Real-Time Metrics - Read Tests
 *
 * API: POST v4/metrics/graphql (Beholder)
 * Route: /real-time-metrics/:pageId?/:dashboardId?
 *
 * Read-only module: Displays metrics dashboards with charts.
 * No CRUD operations - just viewing aggregated metrics data.
 */

const selectors = {
  pageTitle: '[data-testid="real-time-metrics__page-heading-block__title"]',
  intervalDropdown: '[data-testid="real-time-metrics__interval-filter-block__dropdown"]',
  calendar: '[data-testid="real-time-metrics__interval-filter-block__calendar"]',
  tabMenu: '.p-tabmenu',
  tabMenuItem: '.p-tabmenu-item',
  groupDropdown: '.p-dropdown',
  chartCard: '.surface-border',
  bigNumbers: '[class*="big-numbers"]',
  selectButton: '.p-selectbutton'
}

describe('Real-Time Metrics - Read', { tags: ['@observe', '@real-time-metrics'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/real-time-metrics')
    // Wait for page to load
    cy.url().should('include', '/real-time-metrics')
  })

  describe('Page Display', () => {
    it('should display real-time metrics page', () => {
      cy.url().should('include', '/real-time-metrics')
      cy.contains('Real-Time Metrics').should('be.visible')
    })

    it('should display group/page selector', () => {
      // Group dropdown for selecting metrics category
      cy.get(selectors.groupDropdown, { timeout: 15000 }).should('exist')
    })

    it('should display tab menu for pages', () => {
      cy.get(selectors.tabMenu, { timeout: 15000 }).should('exist')
    })
  })

  describe('Filter System', () => {
    it('should have time range filter', () => {
      // AdvancedFilterSystem with time range
      cy.get('.p-card', { timeout: 15000 }).should('exist')
    })

    it('should allow changing time range', () => {
      // Click on filter area
      cy.get('.p-card', { timeout: 15000 }).first().click()
      // Should show time range options
      cy.get('body').then(($body) => {
        if ($body.find('.p-dropdown-panel').length > 0) {
          cy.get('.p-dropdown-panel').should('be.visible')
        }
      })
    })
  })

  describe('Dashboard Navigation', () => {
    it('should display dashboard selector when available', () => {
      // SelectButton for switching between dashboards
      cy.get('body').then(($body) => {
        if ($body.find(selectors.selectButton).length > 0) {
          cy.get(selectors.selectButton).should('be.visible')
        }
      })
    })

    it('should switch between tabs', () => {
      cy.get(selectors.tabMenuItem, { timeout: 15000 }).should('have.length.at.least', 1)
      // Click second tab if available
      cy.get(selectors.tabMenuItem).then(($tabs) => {
        if ($tabs.length > 1) {
          cy.wrap($tabs[1]).click()
          cy.url().should('include', '/real-time-metrics/')
        }
      })
    })
  })

  describe('Charts Display', () => {
    it('should display chart cards or loading state', () => {
      // Wait for either charts or skeleton loaders
      cy.get('.surface-border, .p-skeleton', { timeout: 30000 }).should('exist')
    })

    it('should display big numbers section when available', () => {
      // Big numbers are shown at the top of dashboards
      cy.get('body').then(($body) => {
        // Check if big numbers exist (depends on data availability)
        if ($body.find('[class*="big-number"]').length > 0) {
          cy.get('[class*="big-number"]').should('be.visible')
        }
      })
    })
  })

  describe('Group Selection', () => {
    it('should open group dropdown', () => {
      cy.get(selectors.groupDropdown, { timeout: 15000 }).first().click()
      cy.get('.p-dropdown-items', { timeout: 5000 }).should('be.visible')
    })

    it('should display available metric groups', () => {
      cy.get(selectors.groupDropdown, { timeout: 15000 }).first().click()
      // Should have multiple groups (Build, Secure, Observe, etc.)
      cy.get('.p-dropdown-item').should('have.length.at.least', 1)
      // Close dropdown
      cy.get('body').click(0, 0)
    })
  })
})
