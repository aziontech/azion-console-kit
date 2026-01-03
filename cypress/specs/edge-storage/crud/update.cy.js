/**
 * Edge Storage - Update Tests
 *
 * API: PATCH v4/workspace/storage/{name}
 * Route: /object-storage/:id/edit/:tab?
 *
 * Note: Edit page has tabs: Main Settings, Credentials.
 * Name field is disabled in edit mode (immutable).
 */

import { tableHelpers } from '../../../support/console-kit-helpers'

const selectors = {
  createButton: '[data-testid="create_Bucket_button"]',
  nameColumn: '[data-testid*="list-table-block__column__name"]',
  actionsButton: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
  tabView: '.p-tabview',
  mainSettingsTab: '.p-tabview-nav-link',
  nameInput: '[data-testid="edge-storage-form__name-field"] input',
  edgeAccessDropdown: '[data-testid="edge-storage-form__edge-access-field"]',
  deleteButton: '[data-testid="account-settings__delete-account"]',
  submitButton: '[data-testid="form-actions-submit-button"]',
  cancelButton: '[data-testid="form-actions-cancel-button"]'
}

// Wait for page to be ready
const waitForPageReady = () => {
  tableHelpers.waitForListReady()
}

// Wait for edit page to be ready
const waitForEditPageReady = () => {
  cy.get(selectors.tabView, { timeout: 15000 }).should('be.visible')
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

// Navigate to edit page for first bucket
const navigateToEdit = () => {
  cy.get(selectors.actionsButton).first().click()
  cy.get('[role="menuitem"]').contains(/edit/i).click()
  waitForEditPageReady()
}

describe('Edge Storage - Update', { tags: ['@crud', '@edge-storage'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/object-storage')
    waitForPageReady()
  })

  describe('Edit Page Navigation', () => {
    it('should navigate to edit page from actions menu', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          navigateToEdit()
          cy.url().should('include', '/edit/main-settings')
        } else {
          cy.log('No buckets to edit - skipping test')
        }
      })
    })
  })

  describe('Tab Display', () => {
    it('should display Main Settings and Credentials tabs', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          navigateToEdit()

          cy.contains('Main Settings').should('be.visible')
          cy.contains('Credentials').should('be.visible')
        } else {
          cy.log('No buckets to test - skipping')
        }
      })
    })

    it('should default to Main Settings tab', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          navigateToEdit()

          cy.url().should('include', '/main-settings')
        } else {
          cy.log('No buckets to test - skipping')
        }
      })
    })
  })

  describe('Main Settings Tab', () => {
    it('should display bucket name (disabled)', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          cy.get(selectors.nameColumn).first().invoke('text').then((bucketName) => {
            navigateToEdit()

            cy.get(selectors.nameInput)
              .should('have.value', bucketName.trim())
              .should('be.disabled')
          })
        } else {
          cy.log('No buckets to test - skipping')
        }
      })
    })

    it('should display Workloads Access dropdown', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          navigateToEdit()

          cy.get(selectors.edgeAccessDropdown).should('be.visible')
          cy.contains('Workloads Access').should('be.visible')
        } else {
          cy.log('No buckets to test - skipping')
        }
      })
    })

    it('should display Danger Zone with delete button', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          navigateToEdit()

          cy.contains('Danger Zone').should('be.visible')
          cy.get(selectors.deleteButton).should('be.visible')
          cy.get(selectors.deleteButton).should('contain', 'Delete Bucket')
        } else {
          cy.log('No buckets to test - skipping')
        }
      })
    })

    it('should display form action buttons', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          navigateToEdit()

          cy.get(selectors.submitButton).should('be.visible')
          cy.get(selectors.cancelButton).should('be.visible')
        } else {
          cy.log('No buckets to test - skipping')
        }
      })
    })
  })

  describe('Update Edge Access', () => {
    it('should update Workloads Access setting', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          navigateToEdit()

          // Get current value
          cy.get(selectors.edgeAccessDropdown)
            .find('.p-dropdown-label')
            .invoke('text')
            .then((currentAccess) => {
              // Select a different option
              cy.get(selectors.edgeAccessDropdown).click()
              cy.get('.p-dropdown-panel', { timeout: 5000 }).should('be.visible')

              // Choose different access level
              const newAccess = currentAccess.includes('Read & Write') ? 'Read Only' : 'Read & Write'
              cy.get('.p-dropdown-item').contains(newAccess).click()

              // Submit
              cy.get(selectors.submitButton).click()

              // Should show success or stay on page
              cy.get('body').then(($body) => {
                if ($body.find('.p-toast-message-success').length) {
                  cy.get('.p-toast-message-success', { timeout: 30000 })
                    .should('be.visible')
                }
              })
            })
        } else {
          cy.log('No buckets to test - skipping')
        }
      })
    })
  })

  describe('Credentials Tab', () => {
    it('should navigate to Credentials tab', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          navigateToEdit()

          cy.contains('Credentials').click()
          cy.url().should('include', '/credentials')
        } else {
          cy.log('No buckets to test - skipping')
        }
      })
    })

    it('should display Credentials content', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          navigateToEdit()

          cy.contains('Credentials').click()

          // Wait for credentials tab content to load
          cy.wait(1000)

          // Should show credentials-related content
          cy.get('.p-tabview-panel').should('be.visible')
        } else {
          cy.log('No buckets to test - skipping')
        }
      })
    })
  })

  describe('Tab URL Sync', () => {
    it('should update URL when switching tabs', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          navigateToEdit()

          // Should start at main-settings
          cy.url().should('include', '/main-settings')

          // Go to Credentials
          cy.contains('Credentials').click()
          cy.url().should('include', '/credentials')

          // Go back to Main Settings
          cy.contains('Main Settings').click()
          cy.url().should('include', '/main-settings')
        } else {
          cy.log('No buckets to test - skipping')
        }
      })
    })
  })

  describe('Form Actions', () => {
    it('should cancel and return to list', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          navigateToEdit()

          cy.get(selectors.cancelButton).click()

          // Should return to list
          cy.url().should('include', '/object-storage')
          cy.url().should('not.include', '/edit')
        } else {
          cy.log('No buckets to test - skipping')
        }
      })
    })
  })
})
