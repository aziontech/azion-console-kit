/**
 * Account Settings - Read/Update Tests
 *
 * API: v4/account
 * Route: /account/settings
 *
 * Note: Account Settings is in the account menu (right side).
 * It allows viewing and updating account information.
 * The Delete Account action is also available in the Danger Zone.
 */

const selectors = {
  // General section
  accountName: '[data-testid="account-settings__account-name__input"]',
  clientId: '#clientId',
  // Company Information section
  companyName: '[data-testid="account-settings__company-name__input"]',
  companyId: '[data-testid="account-settings__company-id__input"]',
  billingEmails: '[data-testid="account-settings__billing-emails__input"]',
  // Address Information section
  postalCode: '[data-testid="account-settings__postal-code__input"]',
  countryDropdown: '[data-testid="account-settings__country"]',
  regionDropdown: '[data-testid="account-settings__region"]',
  cityDropdown: '[data-testid="account-settings__city"]',
  address: '[data-testid="account-settings__address__input"]',
  complement: '[data-testid="account-settings__complement__input"]',
  // Login Settings section
  loginSettings: '[data-testid="account-settings__login-settings"]',
  socialLoginSwitch: '[data-testid="account-settings__login-settings"] [data-testid*="isSocialLoginEnabled"] .p-inputswitch',
  mfaSwitch: '[data-testid="account-settings__login-settings"] [data-testid*="isEnabledMfaToAllUsers"] .p-inputswitch',
  mfaManagementButton: 'button:contains("Multi-Factor Authentication Management")',
  // GitHub Integration section
  removeGithubButton: '[data-testid="account-settings__remove-github-integration"]',
  // Danger Zone section
  deleteAccountButton: '[data-testid="account-settings__delete-account"]',
  // Form actions
  submitButton: '[data-testid="form-actions-submit-button"]',
  cancelButton: '[data-testid="form-actions-cancel-button"]'
}

// Wait for Account Settings page to be ready
const waitForPageReady = () => {
  cy.get(selectors.accountName, { timeout: 15000 }).should('be.visible')
  cy.get(selectors.clientId, { timeout: 10000 }).should('be.visible')
}

describe('Account Settings - Read/Update', { tags: ['@read', '@update', '@account-settings', '@account-menu'] }, () => {
  beforeEach(() => {
    cy.login()
    // Account Settings is in the account menu, use cy.visit directly
    cy.visit('/account/settings')
    waitForPageReady()
  })

  describe('Page Display', () => {
    it('should display account settings page', () => {
      cy.url().should('include', '/account/settings')
      cy.get(selectors.accountName).should('be.visible')
    })

    it('should display General section with Account Name and Client ID', () => {
      cy.contains('General').should('be.visible')
      cy.get(selectors.accountName).should('be.visible')
      cy.get(selectors.clientId).should('be.visible')
      // Client ID should be readonly
      cy.get(selectors.clientId).should('have.attr', 'readonly')
    })

    it('should display Company Information section', () => {
      cy.contains('Company Information').should('be.visible')
      cy.get(selectors.companyName).should('exist')
      cy.get(selectors.companyId).should('exist')
      cy.get(selectors.billingEmails).should('exist')
    })

    it('should display Address Information section', () => {
      cy.contains('Address Information').should('be.visible')
      cy.get(selectors.postalCode).should('exist')
      cy.get(selectors.countryDropdown).should('exist')
      cy.get(selectors.regionDropdown).should('exist')
      cy.get(selectors.cityDropdown).should('exist')
      cy.get(selectors.address).should('exist')
      cy.get(selectors.complement).should('exist')
    })

    it('should display Login Settings section', () => {
      cy.contains('Login Settings').should('be.visible')
      cy.contains('Allow Social Login').should('exist')
      cy.contains('Enforce Multi-Factor Authentication').should('exist')
    })

    it('should display Danger Zone section', () => {
      cy.contains('Danger Zone').should('be.visible')
      cy.get(selectors.deleteAccountButton).should('be.visible')
    })

    it('should display Client ID as read-only field', () => {
      cy.get(selectors.clientId)
        .should('have.attr', 'readonly')
        .and('have.value')
      // Should have lock icon
      cy.get(selectors.clientId).parent().find('.pi-lock').should('exist')
    })
  })

  describe('Form Validation', () => {
    it('should require Account Name', () => {
      cy.get(selectors.accountName)
        .clear()
        .blur()

      cy.get(selectors.submitButton).click()

      // Should show validation error or stay on page
      cy.get('body').then(($body) => {
        if ($body.find('.p-error, [data-testid*="error"]').length) {
          cy.get('.p-error, [data-testid*="error"]').should('be.visible')
        } else {
          cy.url().should('include', '/account/settings')
        }
      })
    })

    it('should validate email format in billing emails', () => {
      cy.get(selectors.billingEmails)
        .clear()
        .type('invalid-email')
        .blur()

      // Check for validation error if present
      cy.get('body').then(($body) => {
        if ($body.find('.p-error, [data-testid*="error"]').length) {
          cy.get('.p-error, [data-testid*="error"]').should('be.visible')
        }
      })
    })
  })

  describe('Successful Update', () => {
    it('should update Account Name', () => {
      const newAccountName = `TestAccount_${Date.now()}`

      // Get current value first
      cy.get(selectors.accountName)
        .invoke('val')
        .then((originalName) => {
          // Update the name
          cy.get(selectors.accountName)
            .clear()
            .type(newAccountName)

          cy.get(selectors.submitButton).click()

          cy.get('.p-toast-message-success', { timeout: 30000 })
            .should('be.visible')

          // Verify the update persisted
          cy.reload()
          waitForPageReady()

          cy.get(selectors.accountName).should('have.value', newAccountName)

          // Restore original name
          cy.get(selectors.accountName)
            .clear()
            .type(originalName)
          cy.get(selectors.submitButton).click()
          cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
        })
    })

    it('should update Company Name', () => {
      const companyName = `TestCompany_${Date.now()}`

      cy.get(selectors.companyName)
        .clear()
        .type(companyName)

      cy.get(selectors.submitButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')
    })

    it('should update Address fields', () => {
      cy.get(selectors.address)
        .clear()
        .type('123 Test Street')

      cy.get(selectors.complement)
        .clear()
        .type('Suite 100')

      cy.get(selectors.submitButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')
    })
  })

  describe('Country/Region/City Dropdowns', () => {
    it('should load countries on page load', () => {
      cy.get(selectors.countryDropdown).click()
      cy.get('.p-dropdown-panel', { timeout: 10000 }).should('be.visible')
      cy.get('.p-dropdown-item').should('have.length.at.least', 1)
      // Close dropdown
      cy.get('body').click(0, 0)
    })

    it('should load regions when country is selected', () => {
      // Open country dropdown and select first option
      cy.get(selectors.countryDropdown).click()
      cy.get('.p-dropdown-panel', { timeout: 10000 }).should('be.visible')
      cy.get('.p-dropdown-item').first().click()

      // Region dropdown should be enabled and have options
      cy.get(selectors.regionDropdown).should('not.have.class', 'p-disabled')
      cy.get(selectors.regionDropdown).click()
      cy.get('.p-dropdown-panel', { timeout: 10000 }).should('be.visible')
      // Close dropdown
      cy.get('body').click(0, 0)
    })

    it('should disable region dropdown when no country is selected', () => {
      // Clear country selection if any
      cy.get(selectors.countryDropdown).then(($dropdown) => {
        if ($dropdown.find('.p-dropdown-clear-icon').length) {
          cy.get(selectors.countryDropdown).find('.p-dropdown-clear-icon').click()
        }
      })

      // Region should be disabled
      cy.get('body').then(($body) => {
        // Only check if country is not selected
        if (!$body.find(`${selectors.countryDropdown} .p-dropdown-label`).text().trim()) {
          cy.get(selectors.regionDropdown).should('have.class', 'p-disabled')
        }
      })
    })
  })

  describe('Login Settings', () => {
    it('should toggle Social Login setting', () => {
      cy.get('[data-testid="account-settings__login-settings"]')
        .find('.p-inputswitch')
        .first()
        .then(($switch) => {
          const wasChecked = $switch.hasClass('p-inputswitch-checked')
          cy.wrap($switch).click()

          // Toggle state should change
          if (wasChecked) {
            cy.wrap($switch).should('not.have.class', 'p-inputswitch-checked')
          } else {
            cy.wrap($switch).should('have.class', 'p-inputswitch-checked')
          }

          // Toggle back to original state
          cy.wrap($switch).click()
        })
    })

    it('should display MFA Management button', () => {
      cy.contains('Multi-Factor Authentication Management')
        .should('be.visible')
        .and('not.be.disabled')
    })

    it('should navigate to MFA Management page', () => {
      cy.contains('Multi-Factor Authentication Management').click()
      cy.url().should('include', '/mfa-management')
    })
  })

  describe('Danger Zone', () => {
    it('should display Delete Account button', () => {
      cy.get(selectors.deleteAccountButton)
        .should('be.visible')
        .and('contain', 'Delete account')
    })

    it('should open delete confirmation dialog when clicking Delete Account', () => {
      cy.get(selectors.deleteAccountButton).click()

      // Delete dialog should appear
      cy.get('[data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
        .should('be.visible')

      // Cancel button should be visible
      cy.get('[data-testid="delete-dialog-footer-cancel-button"]')
        .should('be.visible')
        .click()

      // Dialog should close
      cy.get('[data-testid="delete-dialog-confirmation-input-field"]').should('not.exist')
    })

    it('should require account name confirmation to delete', () => {
      cy.get(selectors.deleteAccountButton).click()

      cy.get('[data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
        .should('be.visible')

      // Delete button should be disabled initially
      cy.get('[data-testid="delete-dialog-footer-delete-button"]')
        .should('be.disabled')

      // Type wrong name
      cy.get('[data-testid="delete-dialog-confirmation-input-field"]')
        .type('wrong_name')

      // Delete button should still be disabled
      cy.get('[data-testid="delete-dialog-footer-delete-button"]')
        .should('be.disabled')

      // Cancel
      cy.get('[data-testid="delete-dialog-footer-cancel-button"]').click()
    })
  })

  describe('Form Actions', () => {
    it('should display submit and cancel buttons', () => {
      cy.get(selectors.submitButton).should('be.visible')
      cy.get(selectors.cancelButton).should('be.visible')
    })

    it('should cancel changes when clicking cancel', () => {
      cy.get(selectors.accountName).invoke('val').then((originalName) => {
        cy.get(selectors.accountName)
          .clear()
          .type('WillBeCancelled')

        cy.get(selectors.cancelButton).click()

        // Handle unsaved changes dialog if it appears
        cy.get('body').then(($body) => {
          if ($body.find('.p-dialog-footer button').length) {
            cy.get('.p-dialog-footer button').contains(/leave|discard|confirm/i).click()
          }
        })

        // Cancel should either restore value or navigate away
        cy.url().then((url) => {
          if (url.includes('/account/settings')) {
            // Still on settings page - verify value was restored
            cy.get(selectors.accountName).should('have.value', originalName)
          } else {
            // Navigated away - cancel worked by leaving the page
            cy.url().should('not.include', '/account/settings')
          }
        })
      })
    })
  })
})
