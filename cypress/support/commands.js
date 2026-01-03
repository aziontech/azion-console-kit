/* eslint-disable no-undef */
import selectors from '../support/selectors'

import 'cypress-real-events'

/**
 * Gets a unique session identifier for parallel test execution.
 * Uses shard ID, run ID, or timestamp to ensure unique sessions per runner.
 *
 * @returns {string} Unique session suffix
 */
const getSessionSuffix = () => {
  // GitHub Actions: GITHUB_RUN_ID + matrix index
  const runId = Cypress.env('GITHUB_RUN_ID') || ''
  const shardIndex = Cypress.env('SHARD_INDEX') || ''

  // Cypress parallel: Use spec pattern or machine ID
  const parallelId = Cypress.env('PARALLEL_ID') || ''

  // Custom: Allow explicit session ID
  const sessionId = Cypress.env('SESSION_ID') || ''

  // Fallback: Use a stable ID for the test run (not timestamp to enable caching)
  const stableId = runId || parallelId || sessionId

  if (stableId) {
    return shardIndex ? `${stableId}-shard${shardIndex}` : stableId
  }

  // No parallel ID: use empty string (single runner scenario)
  return ''
}

/**
 * Performs login using provided email and password.
 * IMPORTANT: Session key includes baseUrl and parallel ID to prevent cache issues.
 *
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 */
const login = (email, password) => {
  // Include baseUrl and parallel ID in session key
  const baseUrl = Cypress.env('baseUrl') || 'unknown'
  const sessionSuffix = getSessionSuffix()
  const sessionKey = sessionSuffix
    ? `${email}@${baseUrl}#${sessionSuffix}`
    : `${email}@${baseUrl}`

  cy.session(
    sessionKey,
    () => {
      cy.visit('/login')
      cy.get(selectors.login.emailInput).type(email)
      cy.get(selectors.login.nextButton).click()

      // Assert - password input should have autofocus
      cy.get(selectors.login.passwordInput).should('be.focused')

      cy.get(selectors.login.passwordInput).type(password, { log: false })
      cy.get(selectors.login.signInButton).click()
      cy.location('pathname').should('eq', '/')
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
 * Clear all saved sessions - useful when switching environments.
 * Call this before cy.login() if you've changed baseUrl or environment.
 */
Cypress.Commands.add('clearAllSessions', () => {
  Cypress.session.clearAllSavedSessions()
})

/**
 * Logout the current user.
 * Useful for cleaning up state at end of tests.
 */
Cypress.Commands.add('logout', () => {
  cy.openItemThroughMenuAccount('Logout')
  cy.url({ timeout: 15000 }).should('include', '/login')
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

Cypress.Commands.add('verifyToastWithAction', (summary, detail = '') => {
  const messageText = `${summary}${detail}`
  const customId = `[data-testid="toast-block__content__${messageText}"]`
  const customIdButton = `[data-testid="toast-block__content__${messageText}__link"]`

  cy.get(customId)
    .should('be.visible')
    .and('contain', messageText)
    .then(($toast) => {
      $toast.find(customIdButton).trigger('click')
      $toast.siblings('div').find('.p-toast-icon-close').trigger('click')
    })
    .then(() => {
      cy.get(customId).should('not.be.visible')
    })
})


/**
 * Verifies the visibility and content of a toast message.
 *
 * @param {string} summary - The summary text of the toast message.
 * @param {string} [detail=''] - The detail text of the toast message (optional).
 */
Cypress.Commands.add('verifyToastDelete', (detail = '') => {
  const messageText = `${detail}`
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

const sidebarProducts = [
  'Home',
  'Marketplace',
  'Domains',
  'Edge Application',
  'Variables',
  'Edge Firewall',
  'Edge DNS',
  'Data Stream',
  'Edge Pulse',
  'Real-Time Metrics',
  'Real-Time Events',
  'Real-Time Purge',
  'Edge Functions',
  'Edge Services',
  'Digital Certificates',
  'Network Lists',
  'WAF Rules',
  'Custom Pages',
  'Edge Connectors',
  'Edge SQL'
]
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
 * Converts a product name to a slug format.
 *
 * @param {string} productName - The name of the product.
 * @returns {string} The slugified product name.
 */
const slugifyProductName = (productName) => productName.toLowerCase().replace(/ /g, '-')

/**
 * Contains actions to open a product through the sidebar or account menu.
 */
const productActions = {
  sidebar: (productName) => cy.openProductThroughSidebar(slugifyProductName(productName)),
  account: (productName) => cy.openItemThroughMenuAccount(productName)
}

/**
 * Opens a product through the appropriate menu based on the product name.
 *
 * @param {string} productName - The name of the product.
 * @throws {Error} Will throw an error if the product name is not found in either the sidebar or account menu.
 */
Cypress.Commands.add('openProduct', (productName) => {
  let actionKey = ''

  if (sidebarProducts.includes(productName)) {
    actionKey = 'sidebar'
  } else if (accountProducts.includes(productName)) {
    actionKey = 'account'
  }

  if (actionKey) {
    productActions[actionKey](productName)
  } else {
    throw new Error(`Unknown product: ${productName}`)
  }
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
 * Deletes a product based on its name and optional column name.
 * IMPORTANT: The entityName is used both for searching AND for delete confirmation.
 *
 * @param {string} entityName - The entity name to delete (used in search and confirmation)
 * @param {string} productName - The name of product to access
 * @param {string} columnName - The name of the column containing the product name
 */
const deleteEntityFromList = (entityName, productName, columnName) => {
  cy.openProduct(productName)
  cy.get(selectors.list.searchInput).clear()
  cy.get(selectors.list.searchInput).type(`${entityName}{enter}`)
  cy.get(selectors.list.filteredRow.column(columnName)).should('be.visible')

  cy.get('body').then(($body) => {
    if ($body.find(selectors.list.actionsMenu.button).length) {
      deleteEntityFromMultipleActionColumn(entityName)
    } else {
      deleteEntityFromSingleActionColumn(entityName)
    }
  })
}

/**
 * Deletes an entity from the loaded list. Used to avoid cy.visit an already loaded list.
 * IMPORTANT: entityName is required for delete confirmation dialog.
 *
 * @param {string} entityName - The entity name/key to type in confirmation dialog
 */
const deleteEntityFromLoadedList = (entityName) => {
  cy.get('body').then(($body) => {
    if ($body.find(selectors.list.actionsMenu.button).length) {
      deleteEntityFromMultipleActionColumn(entityName)
    } else {
      deleteEntityFromSingleActionColumn(entityName)
    }
  })
}

/**
 * Deletes entity from single action button column.
 * IMPORTANT: Delete confirmation requires the entity name/key, NOT literal "delete".
 *
 * @param {string} entityName - The entity name/key to type in confirmation dialog
 */
const deleteEntityFromSingleActionColumn = (entityName) => {
  cy.get(selectors.list.singleActionsMenu.button).click()
  cy.get(selectors.list.deleteDialog.confirmationInputField).type(`${entityName}{enter}`)
}

/**
 * Deletes entity from multiple actions menu column.
 * IMPORTANT: Delete confirmation requires the entity name/key, NOT literal "delete".
 *
 * @param {string} entityName - The entity name/key to type in confirmation dialog
 */
const deleteEntityFromMultipleActionColumn = (entityName) => {
  cy.get(selectors.list.actionsMenu.button).click()
  cy.get(selectors.list.actionsMenu.deleteButton).click()
  cy.get(selectors.list.deleteDialog.confirmationInputField).type(`${entityName}{enter}`)
}

/**
 * Deletes a product using the provided name, optional column name, and path.
 *
 * @param {string} productName - The name of the product to delete.
 * @param {string} path - The URL path where the product list is located.
 * @param {string} [columnName='name'] - The name of the column containing the product name (defaults to 'name').
 */
Cypress.Commands.add(
  'deleteEntityFromList',
  ({ entityName, productName, columnName = 'name' } = {}) => {
    deleteEntityFromList(entityName, productName, columnName)
  }
)

/**
 * Deletes an entity from the loaded list.
 * IMPORTANT: entityName is required for delete confirmation dialog.
 *
 * @param {string} entityName - The entity name/key to type in confirmation dialog
 */
Cypress.Commands.add('deleteEntityFromLoadedList', (entityName) => {
  if (!entityName) {
    throw new Error('entityName is required for delete confirmation')
  }
  deleteEntityFromLoadedList(entityName)
})
