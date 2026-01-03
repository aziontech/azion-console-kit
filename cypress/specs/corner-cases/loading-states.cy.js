/**
 * Corner Cases - Loading States & UX Tests
 *
 * Tests loading states and user experience edge cases:
 * - Slow API responses
 * - Loading spinners
 * - Button disabled states during submission
 * - Pagination edge cases
 * - Search edge cases
 */

import { tableHelpers } from '../../support/console-kit-helpers'

describe('Loading States & UX - Corner Cases', { tags: ['@corner-cases', '@ux'] }, () => {
  beforeEach(() => {
    cy.login()
  })

  describe('Slow API Responses', () => {
    it('should show loading spinner during slow list load', () => {
      // Delay response by 3 seconds
      cy.intercept('GET', '**/v4/workspace/functions*', (req) => {
        req.on('response', (res) => {
          res.setDelay(3000)
        })
      }).as('slowList')

      cy.openProduct('Edge Functions')

      // Should show loading indicator
      cy.get(
        '.p-progress-spinner, [data-testid*="loading"], [class*="skeleton"], [class*="loading"]',
        { timeout: 2000 }
      ).should('exist')

      // Eventually should load
      cy.wait('@slowList')
      cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 15000 }).should('exist')
    })

    it('should disable submit button during form submission', () => {
      cy.intercept('POST', '**/v4/workspace/functions', (req) => {
        req.on('response', (res) => {
          res.setDelay(2000)
        })
      }).as('slowCreate')

      cy.openProduct('Edge Functions')
      tableHelpers.waitForListReady()
      cy.get('[data-testid="create_Function_button"]').click()

      cy.get('[data-testid="field-text__input"]', { timeout: 15000 }).type(`slow-test-${Date.now()}`)
      cy.get('[data-testid="form-actions-submit-button"]').click()

      // Button should be disabled or show loading
      cy.get('[data-testid="form-actions-submit-button"]').should('satisfy', ($btn) => {
        return (
          $btn.prop('disabled') ||
          $btn.hasClass('p-disabled') ||
          $btn.find('.p-progress-spinner').length > 0
        )
      })

      cy.wait('@slowCreate')
    })
  })

  describe('Pagination Edge Cases', () => {
    it('should handle last page navigation', () => {
      // Mock paginated response
      cy.intercept('GET', '**/v4/workspace/functions*', (req) => {
        const url = new URL(req.url)
        const page = parseInt(url.searchParams.get('page') || '1')
        const pageSize = parseInt(url.searchParams.get('page_size') || '10')

        req.reply({
          statusCode: 200,
          body: {
            results: Array.from({ length: page === 5 ? 3 : pageSize }, (_, i) => ({
              id: (page - 1) * pageSize + i + 1,
              name: `function-${(page - 1) * pageSize + i + 1}`,
              active: true
            })),
            count: 43, // Total of 43 items = 5 pages
            total_pages: 5
          }
        })
      }).as('paginatedList')

      cy.openProduct('Edge Functions')
      cy.wait('@paginatedList')

      // Navigate to last page if pagination exists
      cy.get('.p-paginator', { timeout: 10000 }).then(($paginator) => {
        if ($paginator.length > 0) {
          // Click last page button
          cy.get('.p-paginator-last, [aria-label*="last"]').click()
          cy.wait('@paginatedList')

          // Should show items
          cy.get('[data-testid*="list-table-block__column__name"]').should('have.length.gte', 1)
        }
      })
    })

    it('should handle empty page after delete', () => {
      // Mock single item on page 2
      cy.intercept('GET', '**/v4/workspace/functions*page=2*', {
        statusCode: 200,
        body: { results: [], count: 10 }
      }).as('emptyPage')

      cy.openProduct('Edge Functions')
      tableHelpers.waitForListReady()

      // If we navigate to empty page, should redirect or show empty
      cy.get('.p-paginator', { timeout: 10000 }).then(($paginator) => {
        if ($paginator.find('.p-paginator-next:not(.p-disabled)').length > 0) {
          cy.get('.p-paginator-next').click()
          // Should handle gracefully
          cy.get('.p-datatable, [data-testid*="empty"]').should('exist')
        }
      })
    })
  })

  describe('Search Edge Cases', () => {
    beforeEach(() => {
      cy.openProduct('Edge Functions')
      tableHelpers.waitForListReady()
    })

    it('should handle search with no results', () => {
      cy.intercept('GET', '**/v4/workspace/functions*search=nonexistent*', {
        statusCode: 200,
        body: { results: [], count: 0 }
      }).as('emptySearch')

      tableHelpers.searchAndSubmit('nonexistent-xyz-123')
      cy.wait('@emptySearch')

      // Should show empty state
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage').should('exist')
    })

    it('should handle special characters in search', () => {
      const specialSearch = 'test@#$%'

      // Type special characters
      cy.get('[data-testid="data-table-search-input"]').clear().type(specialSearch)

      // Should not break the UI
      cy.get('[data-testid="data-table-search-input"]').should('have.value', specialSearch)
    })

    it('should debounce rapid search input', () => {
      let requestCount = 0
      cy.intercept('GET', '**/v4/workspace/functions*', (req) => {
        requestCount++
        req.reply({ results: [], count: 0 })
      }).as('searchRequest')

      // Type rapidly
      cy.get('[data-testid="data-table-search-input"]').clear().type('test123', { delay: 50 })

      // Wait for debounce
      cy.wait(1000)

      // Should have made fewer requests than characters typed (debounced)
      cy.wrap(null).then(() => {
        expect(requestCount).to.be.lessThan(7) // Less than 7 characters
      })
    })

    it('should clear search and show all results', () => {
      // Search first
      tableHelpers.searchAndSubmit('test')

      // Clear search
      cy.get('[data-testid="data-table-search-input"]').clear()
      cy.get('[data-testid="data-table-search-input"]').type('{enter}')

      // Should reload full list
      cy.get('.p-datatable, [data-testid*="empty"]').should('exist')
    })
  })

  describe('Navigation Edge Cases', () => {
    it('should handle back button after form changes', () => {
      cy.openProduct('Edge Functions')
      tableHelpers.waitForListReady()
      cy.get('[data-testid="create_Function_button"]').click()

      // Type something in the form
      cy.get('[data-testid="field-text__input"]', { timeout: 15000 }).type('unsaved-changes')

      // Go back
      cy.go('back')

      // Should either show confirmation dialog or navigate
      cy.get('body').then(($body) => {
        const hasConfirmDialog = $body.find('.p-dialog, [role="dialog"]').length > 0

        if (hasConfirmDialog) {
          // Dialog appeared - test passes
          expect(hasConfirmDialog).to.be.true
        } else {
          // No dialog - should have navigated to list page
          cy.url().should('include', '/edge-functions')
        }
      })
    })

    it('should handle refresh during form edit', () => {
      cy.openProduct('Edge Functions')
      tableHelpers.waitForListReady()
      cy.get('[data-testid="create_Function_button"]').click()

      cy.get('[data-testid="field-text__input"]', { timeout: 15000 }).type('test-before-refresh')

      // Refresh
      cy.reload()

      // Form should be reset
      cy.get('[data-testid="field-text__input"]', { timeout: 15000 }).should('have.value', '')
    })
  })
})
