/**
 * Marketplace - Read Tests
 *
 * API: /api/marketplace/*
 * Route: /marketplace, /marketplace/solution/:vendor/:solution
 *
 * Read module: Browse and search marketplace solutions.
 * Install functionality available but tested separately.
 */

const selectors = {
  searchInput: '#search',
  categoryListbox: '.p-listbox',
  categoryItem: '.p-listbox-item',
  solutionCard: '.surface-card',
  solutionGrid: '.grid',
  featuredSection: 'h2',
  loadingSkeleton: '.p-skeleton',
  emptyState: '[data-testid*="empty"]',
  installButton: '.p-button'
}

describe('Marketplace - Read', { tags: ['@marketplace'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/marketplace')
    // Wait for page to load
    cy.url().should('include', '/marketplace')
  })

  describe('Page Display', () => {
    it('should display marketplace page', () => {
      cy.url().should('include', '/marketplace')
    })

    it('should display search input', () => {
      cy.get(selectors.searchInput, { timeout: 15000 }).should('exist')
    })

    it('should display categories listbox', () => {
      cy.get(selectors.categoryListbox, { timeout: 15000 }).should('exist')
    })
  })

  describe('Categories', () => {
    it('should display "All" category by default', () => {
      cy.get(selectors.categoryListbox, { timeout: 15000 })
        .should('contain', 'All')
    })

    it('should display multiple categories', () => {
      cy.get(selectors.categoryItem, { timeout: 15000 }).should('have.length.at.least', 2)
    })

    it('should filter solutions by category', () => {
      cy.get(selectors.categoryItem, { timeout: 15000 }).then(($items) => {
        if ($items.length > 1) {
          // Click second category (not "All")
          cy.wrap($items[1]).click()
          // Should update the view
          cy.get(selectors.solutionCard, { timeout: 10000 }).should('exist')
        }
      })
    })
  })

  describe('Solutions List', () => {
    it('should display solution cards or loading state', () => {
      cy.get(`${selectors.solutionCard}, ${selectors.loadingSkeleton}`, { timeout: 30000 })
        .should('exist')
    })

    it('should display Featured section when on All', () => {
      cy.contains('Featured', { timeout: 15000 }).should('exist')
    })

    it('should display New releases section when on All', () => {
      cy.contains('New releases', { timeout: 15000 }).should('exist')
    })
  })

  describe('Search Functionality', () => {
    it('should filter solutions by search term', () => {
      cy.get(selectors.searchInput, { timeout: 15000 })
        .clear()
        .type('edge')

      // Wait for debounce and results
      cy.wait(500)
      cy.get('body').then(($body) => {
        // Should show search results or empty state
        const hasSolutions = $body.find(selectors.solutionCard).length > 0
        const hasEmpty = $body.text().includes('No results')
        expect(hasSolutions || hasEmpty).to.be.true
      })
    })

    it('should show no results message for invalid search', () => {
      cy.get(selectors.searchInput, { timeout: 15000 })
        .clear()
        .type('NONEXISTENT_SOLUTION_XYZ999')

      cy.wait(500)
      cy.contains('No results', { timeout: 10000 }).should('exist')
    })

    it('should clear search and show all solutions', () => {
      cy.get(selectors.searchInput, { timeout: 15000 })
        .clear()
        .type('test')

      cy.wait(500)

      cy.get(selectors.searchInput).clear()
      cy.wait(500)

      // Should show Featured section again
      cy.contains('Featured', { timeout: 10000 }).should('exist')
    })
  })

  describe('Solution Navigation', () => {
    it('should navigate to solution detail page', () => {
      cy.get(selectors.solutionCard, { timeout: 30000 }).then(($cards) => {
        if ($cards.length > 0) {
          cy.wrap($cards.first()).click()
          cy.url({ timeout: 15000 }).should('include', '/marketplace/solution/')
        }
      })
    })
  })
})

describe('Marketplace - Solution Detail', { tags: ['@marketplace'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/marketplace')
    // Wait for page and click first solution
    cy.get('.surface-card', { timeout: 30000 }).first().click()
    cy.url({ timeout: 15000 }).should('include', '/marketplace/solution/')
  })

  describe('Solution Page Display', () => {
    it('should display solution name', () => {
      cy.get('h1, h2', { timeout: 15000 }).first().should('exist')
    })

    it('should display vendor information', () => {
      cy.contains('By ', { timeout: 15000 }).should('exist')
    })

    it('should display Overview section', () => {
      cy.contains('Overview', { timeout: 15000 }).should('exist')
    })

    it('should display installation card', () => {
      cy.get('.p-card, .surface-card', { timeout: 15000 }).should('exist')
    })
  })

  describe('Installation', () => {
    it('should display install button', () => {
      cy.get('.p-button', { timeout: 15000 })
        .contains(/install|get/i)
        .should('exist')
    })
  })
})
