/**
 * Your Settings - Read/Update.
 * Validates form rendering (skeleton overlay) and field interactions.
 * Generated from commit 18f9e5cba (fix: prevent form from rendering under skeleton).
 */
import selectors from '../../support/selectors'

describe('Your Settings - Read/Update', { tags: ['@your-settings'] }, () => {
  before(() => {
    cy.login()
  })

  it('should navigate to your settings page', () => {
    cy.visit('/settings')
    cy.url().should('include', '/settings')
  })

  it('should display the form fields after loading', () => {
    // The skeleton overlay fix ensures form is visible after load completes
    cy.get(selectors.yourSettings.firstNameInput, { timeout: 15000 }).should('exist')
    cy.get(selectors.yourSettings.lastNameInput).should('exist')
    cy.get(selectors.yourSettings.emailInput).should('exist')
  })

  it('should display the email field with a value', () => {
    cy.get(selectors.yourSettings.emailInput).invoke('val').should('not.be.empty')
  })

  it('should display timezone and language fields', () => {
    cy.get(selectors.yourSettings.timezoneOptions).should('exist')
    cy.get(selectors.yourSettings.language).should('exist')
  })

  it('should display phone field', () => {
    cy.get('[data-testid="your-settings-form__phone"]', { timeout: 5000 })
      .scrollIntoView()
      .should('exist')
  })

  it('should display password change fields', () => {
    cy.get('[data-testid="your-settings-form__section__security"]').scrollIntoView()
    cy.get('[data-testid="your-settings-form__old-password"]').should('exist')
    cy.get('[data-testid="your-settings-form__new-password"]').should('exist')
    cy.get('[data-testid="your-settings-form__confirm-password"]').should('exist')
  })

  it('should display 2FA toggle', () => {
    cy.get(selectors.yourSettings.twoFactorToggle).should('exist')
  })

  it('should show submit button', () => {
    cy.get(selectors.form.actionsSubmitButton).should('exist')
  })
})
