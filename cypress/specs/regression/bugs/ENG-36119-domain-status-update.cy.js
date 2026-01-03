/**
 * Regression Test: ENG-36119
 * Bug: Domain list not updating activation status after changing a domain
 *
 * Jira: https://azion.atlassian.net/browse/ENG-36119
 * Status: OPEN
 *
 * Steps to reproduce:
 * 1. Access domain list
 * 2. Select a domain and disable it
 * 3. Re-enable the domain
 * 4. Return to domain list
 * Expected: Domain status should reflect the change
 * Actual: Domain status shows old value until page refresh
 *
 * Root cause: Cache invalidation not triggering after domain update
 */

import { tableHelpers, cacheHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/domains'

// Test data - created once for this regression test
const testDomainName = `cy-regression-36119-${Date.now()}`

describe('ENG-36119: Domain Status Update', { tags: ['@regression', '@bug', '@domains', '@cache'] }, () => {
  before(() => {
    // Create a test domain for regression testing
    cy.login()
    cy.openProduct('Domains')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

    // Check if we have any existing domain to test with
    // If no domains, we need to create one (requires edge application)
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid*="list-table-block__column__name"]').length === 0) {
        cy.log('No domains found - test will be skipped')
      }
    })
  })

  beforeEach(() => {
    cy.login()
    cy.openProduct('Domains')
    tableHelpers.waitForListReady()
  })

  it('should update domain status in list after toggling active state', () => {
    // Get first domain in the list
    cy.get('[data-testid*="list-table-block__column__name"]').first().then(($nameCell) => {
      const domainName = $nameCell.text().trim()
      cy.log(`Testing with domain: ${domainName}`)

      // Get current status
      cy.get('[data-testid*="list-table-block__column__active"]').first().then(($statusCell) => {
        const initialStatus = $statusCell.text().trim().toLowerCase()
        cy.log(`Initial status: ${initialStatus}`)

        // Click to edit the domain
        cy.get('[data-testid*="list-table-block__column__name"]').first().click()

        // Wait for edit form to load
        cy.get(selectors.activeSwitchEditForm, { timeout: 15000 }).should('be.visible')

        // Toggle the active switch
        cy.get(selectors.activeSwitchEditForm).click()

        // Save the changes
        cy.get(selectors.formActionsSubmitButton).click()

        // Wait for success toast
        cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

        // Navigate back to list
        cy.openProduct('Domains')
        tableHelpers.waitForListReady()

        // BUG VERIFICATION: Status should be updated in the list
        // The bug causes the status to remain the same until page refresh
        cy.get('[data-testid*="list-table-block__column__name"]')
          .contains(domainName)
          .parents('tr')
          .find('[data-testid*="list-table-block__column__active"]')
          .then(($newStatusCell) => {
            const newStatus = $newStatusCell.text().trim().toLowerCase()
            cy.log(`New status: ${newStatus}`)

            // Status should have changed
            expect(newStatus).to.not.equal(initialStatus,
              'BUG ENG-36119: Domain status should update in list after toggle')
          })

        // Restore original state
        cy.get('[data-testid*="list-table-block__column__name"]').contains(domainName).click()
        cy.get(selectors.activeSwitchEditForm, { timeout: 15000 }).should('be.visible')
        cy.get(selectors.activeSwitchEditForm).click()
        cy.get(selectors.formActionsSubmitButton).click()
        cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
      })
    })
  })

  it('should invalidate cache after domain status change', () => {
    // Setup intercept to verify cache behavior
    cy.intercept('GET', '**/v4/workspace/domains*').as('domainsList')
    cy.intercept('PATCH', '**/v4/workspace/domains/*').as('domainUpdate')

    // Get first domain
    cy.get('[data-testid*="list-table-block__column__name"]').first().click()

    // Wait for edit form
    cy.get(selectors.activeSwitchEditForm, { timeout: 15000 }).should('be.visible')

    // Toggle and save
    cy.get(selectors.activeSwitchEditForm).click()
    cy.get(selectors.formActionsSubmitButton).click()

    // Wait for update to complete
    cy.wait('@domainUpdate').then((interception) => {
      expect(interception.response.statusCode).to.be.oneOf([200, 201, 204])
    })

    // Navigate back
    cy.openProduct('Domains')

    // Verify list is refetched (not served from stale cache)
    cy.wait('@domainsList').then((interception) => {
      // The list should be fetched fresh after mutation
      expect(interception.response.statusCode).to.equal(200)
    })
  })
})
