/**
 * Smoke test for sidebar navigation.
 * Validates that the sidebar toggle works and menu items are clickable.
 */
describe('Sidebar Navigation', { tags: ['@smoke'] }, () => {
  before(() => {
    cy.login()
    cy.visit('/')
  })

  it('should find the sidebar toggle button', () => {
    cy.get('[data-testid="sidebar-block__toggle-button"]', { timeout: 10000 }).should('exist')
  })

  it('should open the sidebar', () => {
    cy.get('[data-testid="sidebar-block__toggle-button"]').click()
    // The Sidebar component should become visible
    cy.get('[data-testid="sidebar-block__menu-item__variables"]', { timeout: 5000 })
      .should('be.visible')
  })

  it('should navigate to Variables via sidebar', () => {
    cy.get('[data-testid="sidebar-block__menu-item__variables"]').click()
    cy.url().should('include', '/variables')
  })
})
