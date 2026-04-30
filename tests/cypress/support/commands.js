/* eslint-disable no-undef */
import selectors from '../support/selectors'

import 'cypress-real-events'

/**
 * Performs login using provided email and password.
 *
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 */
const login = (email, password) => {
  cy.session(
    email,
    () => {
      cy.visit('/login')
      cy.get(selectors.login.emailInput).type(email)
      cy.get(selectors.login.nextButton).click()

      // Wait for password field to appear
      cy.get(selectors.login.passwordInput, { timeout: 10000 }).should('exist')
      cy.get(selectors.login.passwordInput).type(password, { log: false })
      cy.get(selectors.login.signInButton).click()

      // Handle potential MFA redirect
      cy.location('pathname', { timeout: 15000 }).then((pathname) => {
        if (pathname.includes('/mfa/authentication')) {
          const mfaSecret = Cypress.env('MFA_SECRET')
          if (!mfaSecret) {
            throw new Error('MFA_SECRET env var required for MFA-enabled accounts')
          }
          // Enter TOTP code - implementation depends on totp library
          cy.log('MFA authentication required')
        }
      })

      cy.location('pathname', { timeout: 30000 }).should('eq', '/')
    },
    { cacheAcrossSpecs: true }
  )

  cy.visit('/')
}

// Disable test failure for all uncaught exceptions
Cypress.on('uncaught:exception', () => {
  return false
})

/**
 * Custom command to log in a user based on the current environment.
 *
 * @throws Will throw an error if the email or password is not set for the specified environment.
 */
Cypress.Commands.add('login', () => {
  const environment = Cypress.env('environment') || 'dev'
  const isCI = Cypress.env('isCI') === 'true'

  let email, password

  if (isCI) {
    cy.log('Running in CI/CD environment')
    email = Cypress.env('CYPRESS_EMAIL')
    password = Cypress.env('CYPRESS_PASSWORD')

    if (!email || !password) {
      throw new Error('Email or Password not set for CI/CD environment')
    }
  } else {
    switch (environment) {
      case 'stage':
        email = Cypress.env('STAGE_CYPRESS_EMAIL')
        password = Cypress.env('STAGE_CYPRESS_PASSWORD')
        break
      case 'preview-prod':
        email = Cypress.env('PREVIEW_PROD_CYPRESS_EMAIL')
        password = Cypress.env('PREVIEW_PROD_CYPRESS_PASSWORD')
        break
      case 'prod':
        email = Cypress.env('PROD_CYPRESS_EMAIL')
        password = Cypress.env('PROD_CYPRESS_PASSWORD')
        break
      default:
        email = Cypress.env('DEV_CYPRESS_EMAIL')
        password = Cypress.env('DEV_CYPRESS_PASSWORD')
        break
    }
  }

  if (!email || !password) {
    throw new Error(`Email or Password not set for ${environment} environment`)
  }

  cy.log(`Authenticating | ${email}`)
  login(email, password)
})

/**
 * Opens a product through the sidebar menu.
 *
 * @param {string} productSlug - The slug of the product (e.g., 'edge-application').
 */
Cypress.Commands.add('openProductThroughSidebar', (productSlug) => {
  cy.get(selectors.menuSidebar.toggleButton).click()
  cy.get(selectors.menuSidebar.menuItem(productSlug), { timeout: 5000 })
    .should('be.visible')
    .click()
})

/**
 * Opens the feedback dialog.
 */
Cypress.Commands.add('openFeedback', () => {
  cy.get(selectors.header.buttonFeedback.openFeedback).click()
})

/**
 * Opens an item through the account menu.
 *
 * @param {string} menuAccountLabel - The label of the item in the account menu.
 */
Cypress.Commands.add('openItemThroughMenuAccount', (menuAccountLabel) => {
  cy.get(selectors.menuAccount.avatarIcon).click()
  cy.get(selectors.menuAccount.menuItem(menuAccountLabel)).click()
})

/**
 * Verifies a success toast exists.
 * Uses .should('exist') instead of .should('be.visible') because toasts fade fast.
 *
 * @param {string} summary - The summary text of the toast message.
 * @param {string} [detail=''] - The detail text of the toast message (optional).
 */
Cypress.Commands.add('verifyToast', (summary, detail = '') => {
  const messageText = `${summary}${detail}`
  const customId = `[data-testid="toast-block__content__${messageText}"]`

  cy.get(customId, { timeout: 10000 }).should('exist')
})

Cypress.Commands.add('verifyToastWithAction', (summary, detail = '') => {
  const messageText = `${summary}${detail}`
  const customId = `[data-testid="toast-block__content__${messageText}"]`
  const customIdButton = `[data-testid="toast-block__content__${messageText}__link"]`

  cy.get(customId)
    .should('exist')
    .then(($toast) => {
      $toast.find(customIdButton).trigger('click')
    })
})

/**
 * Verifies a delete toast exists.
 */
Cypress.Commands.add('verifyToastDelete', (detail = '') => {
  const messageText = `${detail}`
  const customId = `[data-testid="toast-block__content__${messageText}"]`

  cy.get(customId, { timeout: 10000 }).should('exist')
})

/**
 * Asserts that the expected value has been copied to the clipboard.
 *
 * @param {string} expectedValue - The expected value that should have been copied to the clipboard.
 */
Cypress.Commands.add('assertValueCopiedToClipboard', (expectedValue) => {
  cy.window().then((win) => {
    win.navigator.clipboard.readText().then((text) => {
      const actualValue = text.replace(/\s+/g, ' ').trim()
      expect(actualValue).to.eq(expectedValue)
    })
  })
})

/**
 * Sidebar products mapped by display name → sidebar slug.
 * Slug is used in data-testid="sidebar-block__menu-item__${slug}"
 */
/**
 * Sidebar products mapped by display name → sidebar item ID.
 * IDs sourced from src/services/sidebar-menus-services/menus.js
 */
const sidebarProductMap = {
  Home: 'home',
  Marketplace: 'marketplace',
  Domains: 'domains',
  // Build
  'Edge Application': 'edge-application',
  Variables: 'variables',
  // Secure
  'Edge Connectors': 'edge-connectors',
  'Edge DNS': 'edge-dns',
  'Edge Firewall': 'edge-firewall',
  // Store
  'Object Storage': 'object-storage',
  'Edge Storage': 'object-storage',
  'SQL Database': 'sql-database',
  'Edge SQL': 'sql-database',
  // Deploy
  'Edge Nodes': 'edge-nodes',
  // Observe
  'Data Stream': 'data-stream',
  'Edge Pulse': 'edge-pulse',
  'Real-Time Metrics': 'real-time-metrics',
  'Real-Time Events': 'real-time-events',
  // Tools
  'Real-Time Purge': 'real-time-purge',
  // Edge Libraries
  'Digital Certificates': 'digital-certificates',
  'Custom Pages': 'custom-pages',
  'Edge Services': 'edge-services',
  'Edge Functions': 'edge-functions',
  'Network Lists': 'network-lists',
  'WAF Rules': 'waf-rules'
}

const accountProducts = [
  'Account Settings',
  'Users Management',
  'Billing',
  'Credentials',
  'Activity History',
  'Teams Permissions',
  'Your Settings',
  'Personal Token',
  'Logout'
]

/**
 * Opens a product through the appropriate menu based on the product name.
 *
 * @param {string} productName - The display name of the product.
 */
Cypress.Commands.add('openProduct', (productName) => {
  const sidebarSlug = sidebarProductMap[productName]

  if (sidebarSlug) {
    cy.openProductThroughSidebar(sidebarSlug)
  } else if (accountProducts.includes(productName)) {
    cy.openItemThroughMenuAccount(productName)
  } else {
    throw new Error(`Unknown product: ${productName}`)
  }
})

/**
 * Overwrites the default 'visit' command to include a base URL check.
 *
 * TODO: remove this WORKAROUND for https://github.com/cypress-io/cypress/issues/20647,
 */
Cypress.Commands.overwrite('visit', (original, ...args) => {
  if (!Cypress.env('baseUrl')) {
    throw new Error('Not found $.env.baseUrl but it is required')
  }

  const relative = args.shift()
  const target = new URL(relative, new URL(Cypress.env('baseUrl')))

  return new Promise((resolve) => {
    resolve(original(target.toString(), ...args))
  })
})

/**
 * Deletes an entity from a product list.
 *
 * @param {string} entityName - The entity name to search and delete.
 * @param {string} productName - The product to navigate to.
 * @param {string} [columnName='name'] - The column to verify.
 */
const deleteEntityFromList = (entityName, productName, columnName) => {
  cy.openProduct(productName)
  cy.get(selectors.list.searchInput).clear()
  cy.get(selectors.list.searchInput).type(entityName)
  cy.get(selectors.list.filteredRow.column(columnName), { timeout: 10000 }).should('be.visible')

  // All list views use menu button pattern
  cy.get(selectors.list.actionsMenu.button).first().click()
  cy.get('[role="menuitem"]').contains('Delete').click()
  cy.get(selectors.list.deleteDialog.confirmationInputField).type('delete{enter}')
}

/**
 * Deletes the first entity from the currently loaded list.
 */
const deleteEntityFromLoadedList = () => {
  cy.get(selectors.list.actionsMenu.button).first().click()
  cy.get('[role="menuitem"]').contains('Delete').click()
  cy.get(selectors.list.deleteDialog.confirmationInputField).type('delete{enter}')
}

Cypress.Commands.add(
  'deleteEntityFromList',
  ({ entityName, productName, columnName = 'name' } = {}) => {
    deleteEntityFromList(entityName, productName, columnName)
  }
)

Cypress.Commands.add('deleteEntityFromLoadedList', () => {
  deleteEntityFromLoadedList()
})
