/* eslint-disable no-undef */
/* eslint-disable no-console */
import selectors from '../support/selectors';

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
  cy.visit(`${path}`);
  cy.get(selectors.list.searchInput).clear()
  cy.get(selectors.list.searchInput).type(productName)
  cy.get(selectors.list.filteredRow.nameColumn(columnName)).should('be.visible').should('have.text', productName)
  cy.get(selectors.list.actionsMenu.button).click()
  cy.get(selectors.list.actionsMenu.deleteButton).click()
  cy.get(selectors.list.deleteDialog.confirmationInputField).type('delete')
  cy.get(selectors.list.deleteDialog.deleteButton).click()
};

// Disable test failure for all uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  console.log('Uncaught exception in test:', runnable.title);
  console.error('Uncaught exception:', err);
  return false;
});

/**
 * Performs login using environment variables for email and password.
 */
Cypress.Commands.add('login', () => {
  const email = Cypress.env('CYPRESS_EMAIL_STAGE')
  const password = Cypress.env('CYPRESS_PASSWORD_STAGE')
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
  cy.get(selectors.menuAccount.avatarIcon).click();
  cy.get(selectors.menuAccount.menuItem(menuAccountLabel)).click();
});

/**
 * Deletes a product using the provided name, optional column name, and path.
 * 
 * @param {string} productName - The name of the product to delete.
 * @param {string} path - The URL path where the product list is located.
 * @param {string} [columnName='name'] - The name of the column containing the product name (defaults to 'name').
 */
Cypress.Commands.add('deleteProduct', (productName, path, columnName = 'name') => {
  deleteProduct(productName, path, columnName);
});

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