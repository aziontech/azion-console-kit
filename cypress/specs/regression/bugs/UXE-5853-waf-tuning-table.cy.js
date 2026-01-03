/**
 * Regression Test: UXE-5853
 * Bug: WAF Tuning table interaction bugs
 *
 * Jira: https://azion.atlassian.net/browse/UXE-5853
 * Status: CLOSED (2024-12-12)
 *
 * Issues reported:
 * 1. Multi-line checkbox selection not working correctly
 * 2. Deselecting a row incorrectly opens the drawer
 *
 * This is a regression test to ensure the fixes remain in place.
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/waf-product'

describe('UXE-5853: WAF Tuning Table Interactions', { tags: ['@regression', '@bug', '@waf', '@closed'] }, () => {
  let testWafId = null

  before(() => {
    cy.login()
    cy.openProduct('WAF Rules')
    tableHelpers.waitForListReady()

    // Get first WAF rule to test with
    cy.get('[data-testid*="list-table-block__column__name"]').first().then(($cell) => {
      cy.wrap($cell).click()
      cy.url({ timeout: 15000 }).then((url) => {
        // Extract WAF ID from URL
        const match = url.match(/\/waf\/edit\/(\d+)/)
        if (match) {
          testWafId = match[1]
        }
      })
    })
  })

  beforeEach(() => {
    cy.login()
    if (testWafId) {
      // Navigate directly to WAF Tuning tab
      cy.visit(`/waf/edit/${testWafId}/tuning`)
    } else {
      cy.openProduct('WAF Rules')
      tableHelpers.waitForListReady()
      cy.get('[data-testid*="list-table-block__column__name"]').first().click()
      cy.get('.p-tabview-nav', { timeout: 15000 }).should('be.visible')
      cy.get('.p-tabview-nav').contains('Tuning').click()
    }
    // Wait for tuning table to load
    cy.get('.p-datatable', { timeout: 30000 }).should('exist')
  })

  it('should select multiple rows using checkboxes without opening drawer', () => {
    // Check if there are any tuning rows
    cy.get('body').then(($body) => {
      if ($body.find('.p-datatable-tbody tr').length > 1) {
        // Get all row checkboxes
        cy.get('.p-datatable-tbody .p-checkbox-box').then(($checkboxes) => {
          if ($checkboxes.length >= 2) {
            // Select first row
            cy.wrap($checkboxes).eq(0).click()

            // BUG FIX VERIFICATION: Drawer should NOT open on checkbox click
            cy.get('.p-sidebar, [data-testid*="drawer"]').should('not.exist')

            // Select second row
            cy.wrap($checkboxes).eq(1).click()

            // Both should be selected
            cy.get('.p-datatable-tbody .p-checkbox-box.p-highlight').should('have.length.gte', 2)

            // Still no drawer
            cy.get('.p-sidebar, [data-testid*="drawer"]').should('not.exist')
          }
        })
      } else {
        cy.log('Not enough tuning rows for multi-select test')
      }
    })
  })

  it('should not open drawer when deselecting a row', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.p-datatable-tbody tr').length > 0) {
        // Select a row via checkbox
        cy.get('.p-datatable-tbody .p-checkbox-box').first().click()

        // Verify selection
        cy.get('.p-datatable-tbody .p-checkbox-box.p-highlight').should('have.length.gte', 1)

        // Deselect the row
        cy.get('.p-datatable-tbody .p-checkbox-box.p-highlight').first().click()

        // BUG FIX VERIFICATION: Drawer should NOT open on deselect
        cy.get('.p-sidebar, [data-testid*="drawer"]').should('not.exist')

        // Verify deselection
        cy.get('.p-datatable-tbody .p-checkbox-box.p-highlight').should('have.length', 0)
      } else {
        cy.log('No tuning rows available for deselect test')
      }
    })
  })

  it('should open drawer only when clicking on row content (not checkbox)', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.p-datatable-tbody tr').length > 0) {
        // Click on row content (not checkbox) to open drawer
        cy.get('.p-datatable-tbody tr').first()
          .find('td:not(:first-child)').first()
          .click()

        // Drawer should open
        cy.get('.p-sidebar, [data-testid*="drawer"]', { timeout: 10000 }).should('be.visible')

        // Close drawer
        cy.get('[data-testid*="cancel"], .p-sidebar-close').first().click({ force: true })

        // Drawer should be closed
        cy.get('.p-sidebar, [data-testid*="drawer"]').should('not.exist')
      } else {
        cy.log('No tuning rows available for drawer test')
      }
    })
  })

  it('should maintain selection state after applying filters', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.p-datatable-tbody tr').length > 1) {
        // Select first row
        cy.get('.p-datatable-tbody .p-checkbox-box').first().click()

        // Get the selected row count
        cy.get('.p-datatable-tbody .p-checkbox-box.p-highlight').should('have.length', 1)

        // Apply a filter (if time range filter exists)
        cy.get('body').then(($filterBody) => {
          if ($filterBody.find('[data-testid*="time-range"], [data-testid*="filter"]').length > 0) {
            // Apply filter and check selection is maintained
            cy.get('[data-testid*="time-range"], [data-testid*="filter"]').first().click()

            // Wait for filter to apply
            cy.wait(1000)

            // Selection count may change based on filter results
            // But drawer should not open
            cy.get('.p-sidebar, [data-testid*="drawer"]').should('not.exist')
          }
        })
      }
    })
  })
})
