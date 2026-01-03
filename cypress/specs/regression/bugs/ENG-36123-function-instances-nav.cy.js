/**
 * Regression Test: ENG-36123
 * Bug: Rules Engine opens Function Instance editor instead of returning to list
 *
 * Jira: https://azion.atlassian.net/browse/ENG-36123
 * Status: OPEN
 *
 * Steps to reproduce:
 * 1. Access Edge Application
 * 2. Go to Function Instances tab
 * 3. Edit a function instance
 * 4. Save changes
 * 5. Go to Rules Engine tab
 * 6. Return to Function Instances tab
 * Expected: Should show Function Instances list
 * Actual: Opens the function instance editor instead of the list
 *
 * Root cause: Tab navigation state not being reset properly
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/edge-application'

describe('ENG-36123: Function Instances Navigation', { tags: ['@regression', '@bug', '@edge-applications', '@navigation'] }, () => {
  let testAppId = null

  before(() => {
    cy.login()
    cy.openProduct('Edge Application')
    tableHelpers.waitForListReady()

    // Get first application to test with
    cy.get('[data-testid*="list-table-block__column__name"]').first().then(($cell) => {
      cy.wrap($cell).click()
      cy.url({ timeout: 15000 }).then((url) => {
        // Extract app ID from URL like /edge-application/edit/12345
        const match = url.match(/\/edit\/(\d+)/)
        if (match) {
          testAppId = match[1]
        }
      })
    })
  })

  beforeEach(() => {
    cy.login()
    if (testAppId) {
      cy.visit(`/edge-application/edit/${testAppId}`)
    } else {
      cy.openProduct('Edge Application')
      tableHelpers.waitForListReady()
      cy.get('[data-testid*="list-table-block__column__name"]').first().click()
    }
    cy.get('.p-tabview-nav', { timeout: 15000 }).should('be.visible')
  })

  it('should return to Function Instances list after navigating from Rules Engine', () => {
    // Step 1: Go to Function Instances tab
    cy.get('.p-tabview-nav').contains('Functions Instances').click()
    cy.url().should('include', '/functions-instances')

    // Wait for list to load
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 15000 }).should('exist')

    // Check if there are any function instances
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid*="list-table-block__column__name"]').length > 0) {
        // Step 2: Click on first function instance to edit
        cy.get('[data-testid*="list-table-block__column__name"]').first().click()

        // Wait for drawer/form to open
        cy.get('.p-sidebar, [data-testid*="drawer"]', { timeout: 10000 }).should('be.visible')

        // Step 3: Save/close the editor (click cancel or outside)
        cy.get('[data-testid*="cancel"], .p-sidebar-close').first().click({ force: true })

        // Step 4: Go to Rules Engine tab
        cy.get('.p-tabview-nav').contains('Rules Engine').click()
        cy.url().should('include', '/rules-engine')

        // Step 5: Return to Function Instances tab
        cy.get('.p-tabview-nav').contains('Functions Instances').click()

        // BUG VERIFICATION: Should show the list, not the editor
        cy.url().should('include', '/functions-instances')
        cy.url().should('not.include', '/edit')

        // The list should be visible, not the editor drawer
        cy.get('.p-datatable', { timeout: 10000 }).should('be.visible')
        cy.get('.p-sidebar').should('not.exist')
      } else {
        cy.log('No function instances found - skipping navigation test')
      }
    })
  })

  it('should maintain correct tab state after multiple navigations', () => {
    const tabs = ['Main Settings', 'Origins', 'Cache Settings', 'Rules Engine', 'Functions Instances']

    // Navigate through all tabs
    tabs.forEach((tabName) => {
      cy.get('.p-tabview-nav').contains(tabName).click()
      // Verify we're on the correct tab
      cy.get('.p-tabview-nav-link.p-tabview-nav-link-active, .p-tabview-nav .p-highlight')
        .should('contain', tabName)
    })

    // Return to first tab
    cy.get('.p-tabview-nav').contains('Main Settings').click()
    cy.get('.p-tabview-nav-link.p-tabview-nav-link-active, .p-tabview-nav .p-highlight')
      .should('contain', 'Main Settings')
  })
})
