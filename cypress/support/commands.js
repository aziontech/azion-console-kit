/* eslint-disable no-undef */
/* eslint-disable no-console */

// Define selectors for elements
const selectors = {
  menu: {
    avatarIcon: '[data-testid="profile-block__avatar"]',
    menuItem: (menuItemLabel) =>
      `li[aria-label="${menuItemLabel}"] > .p-menuitem-content > .p-menuitem-link`
  },
  login: {
    emailInput: '[data-testid="signin-block__email-input"]',
    nextButton: '[data-testid="signin-block__next-button"] > .p-button-label',
    passwordInput: '[data-testid="signin-block__password-input"] > .p-inputtext',
    signInButton: '[data-testid="signin-block__signin-button"] > .p-button-label'
  },
  sidebar: {
    toggleButton: '[data-testid="sidebar-block__toggle-button"]',
    menuItem: (productName) => `[data-testid="sidebar-block__menu-item__${productName}"]`
  }
}

// Disable test failure for all uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  console.log('Uncaught exception in test:', runnable.title)
  console.error('Uncaught exception:', err)
  return false
})

// Function to perform login
const login = (email, password) => {
  cy.visit('/login')
  cy.get(selectors.login.emailInput).type(email)
  cy.get(selectors.login.nextButton).click()
  cy.get(selectors.login.passwordInput).type(password, { log: false })
  cy.get(selectors.login.signInButton).click()
}

// Custom command to perform login using environment variables
Cypress.Commands.add('login', () => {
  const email = Cypress.env('CYPRESS_EMAIL_STAGE')
  const password = Cypress.env('CYPRESS_PASSWORD_STAGE')
  cy.log(`🔐 Authenticating | ${email}`)
  login(email, password)
})

// Custom command to open a product through the sidebar menu
Cypress.Commands.add('openProductThroughSidebar', (productName) => {
  cy.get(selectors.sidebar.toggleButton).click()
  cy.get(selectors.sidebar.menuItem(productName)).click()
})

// Custom command to open a menu item
Cypress.Commands.add('openMenuItem', (menuItemLabel) => {
  cy.get(selectors.menu.avatarIcon).click()
  cy.get(selectors.menu.menuItem(menuItemLabel)).click()
})

/**
 * Custom command to handle toast messages.
 *
 * @param {string} message - The message to verify in the toast.
 * @example
 * cy.verifyToast('Your credential token has been created')
 */
Cypress.Commands.add('verifyToast', (message) => {
  const messageText = typeof message === 'string' ? message : message.text
  cy.get(`[data-testid="toast-block__content__${messageText}"]`)
    .should('be.visible')
    .and('contain', messageText)
    .then(($toast) => {
      $toast.siblings('div').find('.p-toast-icon-close').trigger('click')
    })
    .then(() => {
      cy.get(`[data-testid="toast-block__content__${messageText}"]`).should('not.be.visible')
    })
})
