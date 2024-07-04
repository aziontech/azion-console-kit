/* eslint-disable no-undef */
/* eslint-disable no-console */
import selectors from '../support/selectors'

import 'cypress-real-events'

/**
 * Performs login using provided email and password.
 *
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 */
const login = (email, password) => {
  cy.visit('/login')
  cy.get(selectors.login.emailInput).type(email)
  cy.get(selectors.login.nextButton).click()
  cy.get(selectors.login.passwordInput).type(password, { log: false })
  cy.get(selectors.login.signInButton).click()
}

/**
 * Deletes a product based on its name and optional column name.
 *
 * @param {string} productName - The name of the product to delete.
 * @param {string} columnName - The name of the column containing the product name.
 * @param {string} path - The URL path where the product list is located.
 */
const deleteProduct = (productName, path, columnName) => {
  cy.visit(`${path}`)
  cy.get(selectors.list.searchInput).clear()
  cy.get(selectors.list.searchInput).type(productName)
  cy.get(selectors.list.filteredRow.nameColumn(columnName))
    .should('be.visible')
    .should('have.text', productName)
  cy.get(selectors.list.actionsMenu.button).click()
  cy.get(selectors.list.actionsMenu.deleteButton).click()
  cy.get(selectors.list.deleteDialog.confirmationInputField).type('delete')
  cy.get(selectors.list.deleteDialog.deleteButton).click()
}

/**
 * Deletes a product based on its name and optional column name for lists that have only one action button.
 *
 * @param {string} productName - The name of the product to delete.
 * @param {string} columnName - The name of the column containing the product name.
 * @param {string} path - The URL path where the product list is located.
 */
const deleteProductSingleActionColumn = (productName, path, columnName) => {
  cy.visit(`${path}`)
  cy.get(selectors.list.searchInput).clear()
  cy.get(selectors.list.searchInput).type(productName)
  cy.get(selectors.list.filteredRow.nameColumn(columnName))
    .should('be.visible')
    .should('have.text', productName)
  cy.get(selectors.list.singleActionsMenu.button).click()
  cy.get(selectors.list.deleteDialog.confirmationInputField).type('delete')
  cy.get(selectors.list.deleteDialog.deleteButton).click()
}

// Disable test failure for all uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  console.log('Uncaught exception in test:', runnable.title)
  console.error('Uncaught exception:', err)
  return false
})

/**
 * Custom command to log in a user based on the current environment.
 *
 * This command determines the environment from Cypress environment variables and retrieves
 * the corresponding email and password. It logs an error if the email or password is not set
 * for the specified environment. After retrieving the credentials, it performs the login process.
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

  cy.log(`🔐 Authenticating | ${email}`)
  login(email, password)
})

/**
 * Opens a product through the sidebar menu.
 *
 * @param {string} productName - The name of the product to open.
 */
Cypress.Commands.add('openProductThroughSidebar', (productName) => {
  cy.get(selectors.menuSidebar.toggleButton).click()
  cy.get(selectors.menuSidebar.menuItem(productName)).click()
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
 * Deletes a product using the provided name, optional column name, and path.
 *
 * @param {string} productName - The name of the product to delete.
 * @param {string} path - The URL path where the product list is located.
 * @param {string} [columnName='name'] - The name of the column containing the product name (defaults to 'name').
 */
Cypress.Commands.add('deleteProduct', (productName, path, columnName = 'name') => {
  deleteProduct(productName, path, columnName)
})

/**
 * Deletes a product using the provided name, optional column name, and path.
 * Use this for lists with only one action button.
 *
 * @param {string} productName - The name of the product to delete.
 * @param {string} path - The URL path where the product list is located.
 * @param {string} [columnName='name'] - The name of the column containing the product name (defaults to 'name').
 */
Cypress.Commands.add(
  'deleteProductSingleActionColumn',
  (productName, path, columnName = 'name') => {
    deleteProductSingleActionColumn(productName, path, columnName)
  }
)

/**
 * Verifies the visibility and content of a toast message.
 *
 * @param {string} summary - The summary text of the toast message.
 * @param {string} [detail=''] - The detail text of the toast message (optional).
 */
Cypress.Commands.add('verifyToast', (summary, detail = '') => {
  const messageText = `${summary}${detail}`
  const customId = `[data-testid="toast-block__content__${messageText}"]`

  cy.get(customId)
    .should('be.visible')
    .and('contain', messageText)
    .then(($toast) => {
      $toast.siblings('div').find('.p-toast-icon-close').trigger('click')
    })
    .then(() => {
      cy.get(customId).should('not.be.visible')
    })
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
 * Overwrites the default 'visit' command to include a base URL check.
 *
 * This custom visit command ensures that a base URL is set in the environment variables.
 * If the base URL is not found, it throws an error. Otherwise, it constructs the full URL
 * by combining the base URL with the relative path provided and then performs the visit action.
 *
 * TODO: remove this WORKAROUND for https://github.com/cypress-io/cypress/issues/20647,
 *
 * @param {function} original - The original 'visit' function provided by Cypress.
 * @param {...any} args - The arguments passed to the 'visit' function, with the first being the relative path.
 * @throws Will throw an error if the base URL is not found in the environment variables.
 * @returns {Promise} - Resolves when the visit command completes.
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
 * Deletes an entity from the loaded list.
 **/
Cypress.Commands.add('deleteEntityFromList', () => {
  cy.get(selectors.list.actionsMenu.button).click()
  cy.get(selectors.list.actionsMenu.deleteButton).click()
  cy.get(selectors.list.deleteDialog.confirmationInputField).type('delete')
  cy.get(selectors.list.deleteDialog.deleteButton).click()
})
