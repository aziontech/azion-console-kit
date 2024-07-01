/* eslint-disable no-undef */
/* eslint-disable no-console */
import selectors from '../support/selectors';


// Function to perform login
const login = (email, password) => {
  cy.visit('/login')
  cy.get(selectors.login.emailInput).type(email)
  cy.get(selectors.login.nextButton).click()
  cy.get(selectors.login.passwordInput).type(password, { log: false })
  cy.get(selectors.login.signInButton).click()
}

// Function to perform delete a product created
const deleteProduct = (productName, path) => {
  cy.visit(`${path}`);
  cy.get(selectors.list.searchInput).clear()
  cy.get(selectors.list.searchInput).type(productName)
  cy.get(selectors.list.filteredRow.nameColumn).should('be.visible').should('have.text', productName)
  cy.get(selectors.list.actionsMenu.button).click()
  cy.get(selectors.list.actionsMenu.deleteButton).click()
  cy.get(selectors.list.deleteDialog.confirmationInputField).type('delete')
  cy.get(selectors.list.deleteDialog.deleteButton).click()
};

// Disable test failure for all uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  console.log('Uncaught exception in test:', runnable.title)
  console.error('Uncaught exception:', err)
  return false
})

// Custom command to perform login using environment variables
Cypress.Commands.add('login', () => {
  const email = Cypress.env('CYPRESS_EMAIL_STAGE')
  const password = Cypress.env('CYPRESS_PASSWORD_STAGE')
  cy.log(`🔐 Authenticating | ${email}`)
  login(email, password)
})

// Custom command to open a product through the sidebar menu
Cypress.Commands.add('openProductThroughSidebar', (productName) => {
  cy.get(selectors.menuSidebar.toggleButton).click()
  cy.get(selectors.menuSidebar.menuItem(productName)).click()
})

// Custom command to open a item through the account menu
Cypress.Commands.add('openItemThroughMenuAccount', (menuAccountLabel) => {
  cy.get(selectors.menuAccount.avatarIcon).click();
  cy.get(selectors.menuAccount.menuItem(menuAccountLabel)).click();
});

// Custom command to perform login using environment variables
Cypress.Commands.add('deleteProduct', (productName, path) => {
  deleteProduct(productName, path);
});

/**
 * Custom command to verify the visibility and content of a toast message.
 *
 * @param {string} summary - The summary text of the toast message.
 * @param {string} detail - The detail text of the toast message.
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

Cypress.Commands.add('assertValueCopiedToClipboard', (expectedValue) => {
  cy.window()
    .then((win) => {
      return win.navigator.clipboard.readText()
    })
    .then((actualValue) => {
      expect(actualValue.replace(/\s+/g, ' ').trim()).to.eq(expectedValue)
    })
})