/**
 * Edge Pulse - Read Tests
 *
 * API: None (static page)
 * Route: /edge-pulse
 *
 * Static module: Displays RUM client script tags for integration.
 * No API calls - just displays code snippets to copy.
 */

const selectors = {
  defaultTab: '[data-testid="edge-pulse__default-tab"]',
  preLoadingTab: '[data-testid="edge-pulse__pre-loading-tab"]',
  tabView: '.p-tabview',
  tabPanel: '.p-tabview-panel',
  tabHeader: '.p-tabview-nav-link',
  codeEditor: '.monaco-editor',
  copyButton: '.p-button'
}

describe('Edge Pulse - Read', { tags: ['@observe', '@edge-pulse'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/edge-pulse')
    // Wait for page to load
    cy.url().should('include', '/edge-pulse')
  })

  describe('Page Display', () => {
    it('should display edge pulse page', () => {
      cy.url().should('include', '/edge-pulse')
      cy.contains('Edge Pulse').should('be.visible')
    })

    it('should display tab view with two tabs', () => {
      cy.get(selectors.tabView, { timeout: 15000 }).should('exist')
      cy.get(selectors.tabHeader).should('have.length', 2)
    })
  })

  describe('Default Tag Tab', () => {
    it('should display Default Tag tab by default', () => {
      cy.get(selectors.defaultTab, { timeout: 15000 }).should('exist')
    })

    it('should display code editor with script', () => {
      cy.get(selectors.codeEditor, { timeout: 15000 }).should('exist')
    })

    it('should display copy button', () => {
      cy.contains('Copy script', { timeout: 15000 }).should('exist')
    })

    it('should contain azion-pulse.js script in default tag', () => {
      cy.get(selectors.codeEditor, { timeout: 15000 })
        .should('contain.text', 'azion-pulse.js')
    })
  })

  describe('Pre-loading Tag Tab', () => {
    beforeEach(() => {
      cy.get(selectors.preLoadingTab, { timeout: 15000 }).click()
    })

    it('should switch to Pre-loading Tag tab', () => {
      // Verify the tab content changed to show async script
      cy.get(selectors.codeEditor, { timeout: 15000 })
        .should('contain.text', 'async')
    })

    it('should display code editor with async script', () => {
      cy.get(selectors.codeEditor, { timeout: 15000 }).should('exist')
    })

    it('should display copy button', () => {
      cy.contains('Copy script', { timeout: 15000 }).should('exist')
    })

    it('should contain async attribute in pre-loading script', () => {
      cy.get(selectors.codeEditor, { timeout: 15000 })
        .should('contain.text', 'async')
    })
  })

  describe('Copy Functionality', () => {
    it('should have copy button for default tag', () => {
      cy.get('[data-testid="copy-block__copy-button"]', { timeout: 15000 })
        .should('be.visible')
        .and('be.enabled')
    })

    it('should have copy button for pre-loading tag', () => {
      cy.get(selectors.preLoadingTab, { timeout: 15000 }).click()
      cy.get('[data-testid="copy-block__copy-button"]', { timeout: 15000 })
        .should('be.visible')
        .and('be.enabled')
    })
  })
})
