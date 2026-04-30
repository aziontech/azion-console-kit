/**
 * Table helpers for interacting with ListTable component.
 * Aligned with src/components/list-table/ListTable.vue testids.
 */
import selectors from '../selectors'

const tableHelpers = {
  /**
   * Waits for the list table to be ready (loaded with data or empty state).
   */
  waitForListReady() {
    cy.get(selectors.list.container, { timeout: 30000 }).should('exist')
    cy.get(selectors.list.dataTable, { timeout: 30000 }).should('exist')
  },

  /**
   * Searches for an entity in the list table.
   * @param {string} term - The search term
   */
  searchFor(term) {
    cy.get(selectors.list.searchInput).clear()
    cy.get(selectors.list.searchInput).type(term)
  },

  /**
   * Clicks a row by column value.
   * @param {string} columnName - The column field name
   * @param {string} value - The text value to look for
   */
  clickRowByColumn(columnName, value) {
    cy.get(selectors.list.filteredRow.column(columnName)).contains(value).click()
  },

  /**
   * Opens the actions menu for the first visible row.
   */
  openActionsMenu() {
    cy.get(selectors.list.actionsMenu.button).first().click()
  },

  /**
   * Clicks a menu item from the actions menu.
   * @param {string} label - The menu item label (e.g., 'Delete')
   */
  clickActionsMenuItem(label) {
    cy.get(`[role="menuitem"]`).contains(label).click()
  },

  /**
   * Performs the delete flow: open actions menu → click Delete → type confirmation → confirm.
   * @param {string} confirmationText - Text to type in the confirmation input (default: 'delete')
   */
  deleteFirstRow(confirmationText = 'delete') {
    this.openActionsMenu()
    this.clickActionsMenuItem('Delete')
    cy.get(selectors.list.deleteDialog.confirmationInputField).type(
      `${confirmationText}{enter}`
    )
  },

  /**
   * Clicks the create button for a specific module.
   * @param {string} moduleName - The module name (e.g., 'EdgeApplication', 'WAFRule')
   */
  clickCreateButton(moduleName) {
    cy.get(selectors.list.createButton(moduleName)).click()
  },

  /**
   * Verifies a column value exists in the table.
   * @param {string} columnName - The column field name
   * @param {string} value - Expected value
   */
  verifyColumnValue(columnName, value) {
    cy.get(selectors.list.filteredRow.column(columnName)).should('contain', value)
  },

  /**
   * Verifies the table shows empty state.
   */
  verifyEmptyState() {
    cy.get(selectors.list.filteredRow.empty).should('exist')
  },

  /**
   * Clicks the refresh button in the table header.
   */
  refresh() {
    cy.get(selectors.list.refreshButton).click()
  }
}

export default tableHelpers
