/**
 * Workloads - Read/List CRUD Tests
 *
 * API: GET v4/workspace/workloads
 * Route: /domains (uses Workload/ListView.vue)
 *
 * Tests: List workloads, verify columns, search, pagination
 *
 * Note: Workloads is the v4 replacement for Domains
 * The UI is accessed via "Domains" in sidebar but uses Workload services
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/workload'

describe('Workloads - Read/List', { tags: ['@crud', '@workloads', '@domains'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Domains')
    tableHelpers.waitForListReady()
  })

  describe('List View Structure', () => {
    it('should display workloads/domains list page', () => {
      // Verify page title contains Domains or Workloads
      cy.get('[data-testid*="page"]', { timeout: 15000 }).should('exist')
      // Note: Domains sidebar item actually routes to /workloads
      cy.url().should('match', /\/(domains|workloads)/)
    })

    it('should have create button', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).should('be.visible')
    })

    it('should display table or empty state', () => {
      // Wait for page to load - either table or empty state
      cy.get('.p-datatable, [class*="empty"], button:contains("Workload")', { timeout: 30000 }).should('exist')

      // Check if table exists (has data) or empty state
      cy.get('body').then(($body) => {
        if ($body.find('.p-datatable').length > 0) {
          // Verify expected columns exist
          cy.get('.p-datatable-thead').within(() => {
            cy.contains('th', 'ID').should('exist')
            cy.contains('th', 'Name').should('exist')
            cy.get('th').should('have.length.at.least', 3)
          })
        } else {
          // Empty state is shown
          cy.contains('No Workload').should('exist')
          cy.contains('button', 'Workload').should('exist')
        }
      })
    })

    it('should have search input when data exists', () => {
      // Search input only appears when table has data
      cy.get('body').then(($body) => {
        if ($body.find('.p-datatable').length > 0) {
          cy.get('[data-testid*="search"], [data-testid*="Search"], input[type="search"]', { timeout: 10000 })
            .should('be.visible')
        } else {
          // Empty state - no search needed
          cy.log('No data - search input not shown in empty state')
        }
      })
    })
  })

  describe('Data Display', () => {
    it('should display workload/domain data in rows or empty state', () => {
      // Wait for page to load
      cy.get('.p-datatable, [class*="empty"], button:contains("Workload")', { timeout: 30000 }).should('exist')

      cy.get('body').then(($body) => {
        if ($body.find('.p-datatable-tbody tr').length > 0) {
          // Verify first row has data
          cy.get('.p-datatable-tbody tr').first().within(() => {
            cy.get('td').should('have.length.at.least', 3)
          })
        } else {
          // Empty state - verify create button exists
          cy.contains('button', 'Workload').should('exist')
        }
      })
    })

    it('should show status column with active/inactive tags', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.p-datatable-tbody tr').length > 0) {
          // Look for status tags
          cy.get('.p-datatable-tbody').within(() => {
            cy.get('.p-tag, [class*="tag"]').should('exist')
          })
        }
      })
    })

    it('should show action button for each row', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.p-datatable-tbody tr').length > 0) {
          cy.get('.p-datatable-tbody tr').first().within(() => {
            cy.get('[data-testid*="action"], .pi-ellipsis-v, .pi-trash').should('exist')
          })
        }
      })
    })
  })

  describe('Search Functionality', () => {
    it('should filter workloads by search term when data exists', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.p-datatable-tbody tr').length > 0) {
          // Get name from first row
          cy.get(selectors.listTableBlockColumnNameRow).first().invoke('text').then((name) => {
            const searchTerm = name.trim().substring(0, 5)

            if (searchTerm) {
              // Search for term
              tableHelpers.searchAndSubmit(searchTerm)

              // Verify results contain search term
              cy.get('.p-datatable-tbody', { timeout: 15000 }).should('contain', searchTerm)
            }
          })
        } else {
          cy.log('No data to search - skipping search test')
        }
      })
    })

    it('should show empty state when no workloads exist', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.p-datatable').length === 0) {
          // Verify empty state message
          cy.contains('No Workload').should('exist')
          cy.contains('Click the button below to create').should('exist')
        } else {
          cy.log('Data exists - empty state test not applicable')
        }
      })
    })
  })

  describe('Row Navigation', () => {
    it('should navigate to edit page when clicking a row (if data exists)', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.p-datatable-tbody tr').length > 0) {
          // Click on the first row
          cy.get(selectors.listTableBlockColumnNameRow).first().click()

          // Should navigate to edit page
          cy.url({ timeout: 15000 }).should('match', /\/(domains|workloads)\/edit\/\d+/)
        } else {
          cy.log('No workloads/domains to test row navigation - empty state')
        }
      })
    })
  })

  describe('Sorting', () => {
    it('should sort by name column', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.p-datatable-tbody tr').length > 1) {
          // Click on Name header to sort
          cy.get('.p-datatable-thead').contains('th', 'Name').click()

          // Verify sort indicator appears
          cy.get('.p-datatable-thead th').contains('Name')
            .parents('th')
            .find('.p-sortable-column-icon, .pi-sort-alt, .pi-sort-amount-up-alt, .pi-sort-amount-down-alt')
            .should('exist')
        }
      })
    })
  })

  describe('Locked Workloads', () => {
    it('should display locked indicator for custom product version', () => {
      // Check if any workloads have locked status
      cy.get('body').then(($body) => {
        if ($body.find('.pi-lock').length > 0) {
          cy.get('.pi-lock').first().should('be.visible')
          // Locked workloads should have warning tag
          cy.get('.pi-lock').first().parents('td').within(() => {
            cy.get('.p-tag[class*="warning"], [class*="warning"]').should('exist')
          })
        } else {
          cy.log('No locked workloads found in list')
        }
      })
    })
  })
})
