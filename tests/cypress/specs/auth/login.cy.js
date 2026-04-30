/**
 * Login smoke test.
 * Validates the basic email → password → sign-in flow.
 * Generated from commit 61577d45a (revert: hubspot tracking).
 */
import selectors from '../../support/selectors'

describe('Login', { tags: ['@smoke', '@auth'] }, () => {
  it('should display login form with email input', () => {
    cy.visit('/login')
    cy.get(selectors.login.emailInput, { timeout: 10000 }).should('exist')
  })

  it('should advance to password step after entering email', () => {
    const email = Cypress.env('STAGE_CYPRESS_EMAIL') || Cypress.env('email')
    cy.get(selectors.login.emailInput).clear().type(email)
    cy.get(selectors.login.nextButton).click()
    cy.get(selectors.login.passwordInput, { timeout: 10000 }).should('exist')
  })

  it('should sign in successfully with valid credentials', () => {
    const password = Cypress.env('STAGE_CYPRESS_PASSWORD') || Cypress.env('password')
    cy.get(selectors.login.passwordInput).clear().type(password)
    cy.get(selectors.login.signInButton).click()

    // After login, user should be redirected away from /login
    // May go to /mfa/* for 2FA accounts or / for regular accounts
    cy.url({ timeout: 15000 }).should('not.include', '/login')
  })
})
