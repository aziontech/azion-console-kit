/**
 * Edge SQL - Update Tests
 *
 * API: PATCH v4/workspace/sql/databases/{id}
 * Route: /sql-database/database/:id/settings
 *
 * Note: Edge SQL edit has 3 tabs: Tables, Editor, Settings.
 * Settings tab has name field, active toggle, and delete button.
 * The update action bar has submitDisabled by default.
 */

import { tableHelpers } from '../../../support/console-kit-helpers'

const selectors = {
  listContentBlock: '[data-testid="edge-sql-content-block"]',
  createButton: '[data-testid="create_Database_button"]',
  tabView: '.p-tabview',
  tablesTab: '[data-testid="sql-database-tabs__tab__tables"]',
  editorTab: '[data-testid="sql-database-tabs__tab__editor"]',
  settingsTab: '[data-testid="sql-database-tabs__tab__settings"]',
  editFormBlock: '[data-testid="edit-edge-sql-database-form-block"]',
  formFields: '[data-testid="edit-edge-sql-database-form-fields"]',
  nameInput: '[data-testid="database-name-field"] input',
  activeSwitch: '[name="active"]',
  deleteButton: '[data-testid="account-settings__delete-account"]',
  submitButton: '[data-testid="form-actions-submit-button"]',
  cancelButton: '[data-testid="form-actions-cancel-button"]',
  nameColumn: '[data-testid*="list-table-block__column__name"]',
  actionsButton: '[data-testid="data-table-actions-column-body-actions-menu-button"]'
}

const generateDatabaseName = (prefix = 'upd') => {
  return `${prefix}-${Date.now()}`
}

// Wait for edit page to be ready
const waitForEditPageReady = () => {
  cy.get(selectors.tabView, { timeout: 15000 }).should('be.visible')
}

// Wait for settings tab to be ready
const waitForSettingsReady = () => {
  cy.get(selectors.nameInput, { timeout: 10000 }).should('be.visible')
}

// Helper to check if list has data
const hasListData = () => {
  return cy.get('body').then(($body) => {
    const hasTable = $body.find('.p-datatable').length > 0
    const hasRows = $body.find('[data-testid*="list-table-block__column__name"]').length > 0
    return hasTable && hasRows
  })
}

// Create a database for testing
const createDatabaseForTest = (name) => {
  cy.visit('/sql-database/create')
  cy.get('[data-testid="database-name-field"] input', { timeout: 10000 }).should('be.visible')
  cy.get('[data-testid="database-name-field"] input')
    .clear()
    .type(name)
  cy.get('[data-testid="form-actions-submit-button"]').click()

  // Wait for redirect to list
  cy.get(selectors.listContentBlock, { timeout: 30000 }).should('be.visible')

  // Search for created database
  tableHelpers.searchAndSubmit(name)
  cy.get(selectors.nameColumn, { timeout: 15000 }).should('contain', name)
}

describe('Edge SQL - Update', { tags: ['@crud', '@edge-sql'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/sql-database')
    cy.get(selectors.listContentBlock, { timeout: 15000 }).should('be.visible')
    tableHelpers.waitForListReady()
  })

  describe('Edit Page Navigation', () => {
    it('should navigate to edit page from list', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          cy.get(selectors.nameColumn).first().click()
          cy.url().should('include', '/sql-database/database/')
          waitForEditPageReady()
        } else {
          cy.log('No databases to edit - skipping test')
        }
      })
    })
  })

  describe('Tab Display', () => {
    it('should display all tabs', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          cy.get(selectors.nameColumn).first().click()
          waitForEditPageReady()

          cy.get(selectors.tablesTab).should('be.visible')
          cy.get(selectors.editorTab).should('be.visible')
          cy.get(selectors.settingsTab).should('be.visible')
        } else {
          cy.log('No databases to test - skipping')
        }
      })
    })

    it('should default to Tables tab', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          cy.get(selectors.nameColumn).first().click()
          waitForEditPageReady()

          cy.get(selectors.tablesTab)
            .should('have.class', 'p-tabview-selected')
        } else {
          cy.log('No databases to test - skipping')
        }
      })
    })
  })

  describe('Settings Tab', () => {
    it('should navigate to Settings tab', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          cy.get(selectors.nameColumn).first().click()
          waitForEditPageReady()

          cy.get(selectors.settingsTab).click()
          waitForSettingsReady()

          cy.url().should('include', '/settings')
        } else {
          cy.log('No databases to test - skipping')
        }
      })
    })

    it('should display database name in Settings', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          cy.get(selectors.nameColumn).first().invoke('text').then((dbName) => {
            cy.get(selectors.nameColumn).first().click()
            waitForEditPageReady()

            cy.get(selectors.settingsTab).click()
            waitForSettingsReady()

            cy.get(selectors.nameInput).should('have.value', dbName.trim())
          })
        } else {
          cy.log('No databases to test - skipping')
        }
      })
    })

    it('should display Active toggle in Settings', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          cy.get(selectors.nameColumn).first().click()
          waitForEditPageReady()

          cy.get(selectors.settingsTab).click()
          waitForSettingsReady()

          cy.contains('Status').should('be.visible')
          cy.contains('Active').should('be.visible')
        } else {
          cy.log('No databases to test - skipping')
        }
      })
    })

    it('should display Danger Zone with delete button', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          cy.get(selectors.nameColumn).first().click()
          waitForEditPageReady()

          cy.get(selectors.settingsTab).click()
          waitForSettingsReady()

          cy.contains('Danger Zone').should('be.visible')
          cy.get(selectors.deleteButton).should('be.visible')
          cy.get(selectors.deleteButton).should('contain', 'Delete database')
        } else {
          cy.log('No databases to test - skipping')
        }
      })
    })
  })

  describe('Editor Tab', () => {
    it('should navigate to Editor tab', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          cy.get(selectors.nameColumn).first().click()
          waitForEditPageReady()

          cy.get(selectors.editorTab).click()

          cy.url().should('include', '/editor')
          cy.get(selectors.editorTab).should('have.class', 'p-tabview-selected')
        } else {
          cy.log('No databases to test - skipping')
        }
      })
    })
  })

  describe('Tables Tab', () => {
    it('should display Tables tab content', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          cy.get(selectors.nameColumn).first().click()
          waitForEditPageReady()

          cy.get(selectors.tablesTab).click()

          cy.get(selectors.tablesTab).should('have.class', 'p-tabview-selected')
        } else {
          cy.log('No databases to test - skipping')
        }
      })
    })
  })

  describe('Tab URL Sync', () => {
    it('should update URL when switching tabs', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          cy.get(selectors.nameColumn).first().click()
          waitForEditPageReady()

          // Go to Editor
          cy.get(selectors.editorTab).click()
          cy.url().should('include', '/editor')

          // Go to Settings
          cy.get(selectors.settingsTab).click()
          cy.url().should('include', '/settings')

          // Go back to Tables
          cy.get(selectors.tablesTab).click()
          cy.url().should('include', '/tables')
        } else {
          cy.log('No databases to test - skipping')
        }
      })
    })
  })
})
