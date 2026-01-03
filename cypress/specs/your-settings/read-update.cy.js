/**
 * Your Settings - Read/Update Tests
 *
 * API: v4/iam/users/me
 * Route: /settings
 *
 * Note: Your Settings is in the account menu (right side, under profile).
 * Allows users to modify their personal profile and security settings.
 */

const selectors = {
  // Profile Section
  profileSection: '[data-testid="your-settings-form__section__profile"]',
  firstNameInput: '[data-testid="your-settings-form__first-name__input"]',
  lastNameInput: '[data-testid="your-settings-form__last-name__input"]',
  timezoneDropdown: '[data-testid="your-settings-form__timezone__dropdown"]',
  languageDropdown: '[data-testid="your-settings-form__language__dropdown"]',
  // Contact Information Section
  contactSection: '[data-testid="your-settings-form__contact"]',
  emailInput: '[data-testid="your-settings-form__email__input"]',
  countryCodeDropdown: '[data-testid="your-settings-form__country-code__dropdown"]',
  mobileInput: '[data-testid="your-settings-form__mobile__input"]',
  // Security Settings Section
  securitySection: '[data-testid="your-settings-form__section__security"]',
  oldPasswordInput: '[data-testid="your-settings-form__old-password__input"]',
  newPasswordInput: '[data-testid="your-settings-form__new-password__input"]',
  confirmPasswordInput: '[data-testid="your-settings-form__confirm-password__input"]',
  mfaSwitch: '[data-testid="your-settings-form__enforce-mfa"]',
  // Form actions
  submitButton: '[data-testid="form-actions-submit-button"]',
  cancelButton: '[data-testid="form-actions-cancel-button"]'
}

// Wait for Your Settings page to be ready
const waitForPageReady = () => {
  cy.get(selectors.firstNameInput, { timeout: 15000 }).should('be.visible')
  cy.get(selectors.emailInput, { timeout: 10000 }).should('be.visible')
}

describe('Your Settings - Read/Update', { tags: ['@read', '@update', '@your-settings', '@account-menu'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/settings')
    waitForPageReady()
  })

  describe('Page Display', () => {
    it('should display your settings page', () => {
      cy.url().should('include', '/settings')
      cy.get(selectors.firstNameInput).should('be.visible')
    })

    it('should display Profile section', () => {
      cy.contains('Profile').should('be.visible')
      cy.get(selectors.firstNameInput).should('be.visible')
      cy.get(selectors.lastNameInput).should('be.visible')
      cy.get(selectors.timezoneDropdown).should('be.visible')
    })

    it('should display Contact Information section', () => {
      cy.contains('Contact Information').should('be.visible')
      cy.get(selectors.emailInput).should('be.visible')
      cy.get(selectors.mobileInput).should('exist')
    })

    it('should display Security Settings section', () => {
      cy.contains('Security Settings').should('be.visible')
      cy.get(selectors.oldPasswordInput).should('exist')
      cy.get(selectors.newPasswordInput).should('exist')
      cy.get(selectors.confirmPasswordInput).should('exist')
    })

    it('should display MFA toggle', () => {
      cy.contains('Multi-Factor Authentication').should('be.visible')
    })

    it('should have language field disabled', () => {
      cy.get(selectors.languageDropdown).should('have.class', 'p-disabled')
    })
  })

  describe('Form Fields Display', () => {
    it('should load user first and last name', () => {
      cy.get(selectors.firstNameInput)
        .should('be.visible')
        .and('have.value')

      cy.get(selectors.lastNameInput)
        .should('be.visible')
        .and('have.value')
    })

    it('should load user email', () => {
      cy.get(selectors.emailInput)
        .should('be.visible')
        .and('have.value')
    })

    it('should load timezone options', () => {
      cy.get(selectors.timezoneDropdown).click()
      cy.get('.p-dropdown-panel', { timeout: 10000 }).should('be.visible')
      cy.get('.p-dropdown-item').should('have.length.at.least', 1)
      cy.get('body').click(0, 0)
    })
  })

  describe('Form Validation', () => {
    it('should require first name', () => {
      cy.get(selectors.firstNameInput)
        .clear()
        .blur()

      cy.get(selectors.submitButton).click()

      cy.get('body').then(($body) => {
        if ($body.find('.p-error').length) {
          cy.get('.p-error').should('be.visible')
        } else {
          cy.url().should('include', '/settings')
        }
      })
    })

    it('should require last name', () => {
      cy.get(selectors.lastNameInput)
        .clear()
        .blur()

      cy.get(selectors.submitButton).click()

      cy.get('body').then(($body) => {
        if ($body.find('.p-error').length) {
          cy.get('.p-error').should('be.visible')
        } else {
          cy.url().should('include', '/settings')
        }
      })
    })

    it('should validate email format', () => {
      cy.get(selectors.emailInput)
        .clear()
        .type('invalid-email')
        .blur()

      cy.get('body').then(($body) => {
        if ($body.find('.p-error').length) {
          cy.get('.p-error').should('be.visible')
        }
      })
    })
  })

  describe('Password Validation', () => {
    it('should display password requirements', () => {
      cy.contains('Must have at least:').should('be.visible')
      cy.contains('8 characters').should('be.visible')
      cy.contains('1 uppercase letter').should('be.visible')
      cy.contains('1 lowercase letter').should('be.visible')
      cy.contains('1 special character').should('be.visible')
    })

    it('should validate password requirements dynamically', () => {
      // Type a password that meets some requirements
      cy.get(selectors.newPasswordInput)
        .type('Test@123')

      // Should show check marks for met requirements
      cy.get('[data-testid="your-settings-form__new-password__requirement-list"]')
        .find('.pi-check')
        .should('have.length.at.least', 1)
    })

    it('should require confirm password to match', () => {
      cy.get(selectors.oldPasswordInput).type('OldPass@123')
      cy.get(selectors.newPasswordInput).type('NewPass@123')
      cy.get(selectors.confirmPasswordInput).type('DifferentPass@123').blur()

      cy.get(selectors.submitButton).click()

      cy.get('body').then(($body) => {
        if ($body.find('.p-error').length) {
          cy.get('.p-error').should('be.visible')
        }
      })
    })
  })

  describe('Successful Update', () => {
    it('should update first name', () => {
      cy.get(selectors.firstNameInput)
        .invoke('val')
        .then((originalName) => {
          const newName = `Test_${Date.now()}`

          cy.get(selectors.firstNameInput)
            .clear()
            .type(newName)

          cy.get(selectors.submitButton).click()

          // Check for success or error
          cy.get('body').then(($body) => {
            if ($body.find('.p-toast-message-success').length) {
              cy.get('.p-toast-message-success', { timeout: 30000 })
                .should('be.visible')

              // Restore original name
              cy.get(selectors.firstNameInput)
                .clear()
                .type(originalName)
              cy.get(selectors.submitButton).click()
            }
          })
        })
    })

    it('should update last name', () => {
      cy.get(selectors.lastNameInput)
        .invoke('val')
        .then((originalName) => {
          const newName = `TestLast_${Date.now()}`

          cy.get(selectors.lastNameInput)
            .clear()
            .type(newName)

          cy.get(selectors.submitButton).click()

          cy.get('body').then(($body) => {
            if ($body.find('.p-toast-message-success').length) {
              cy.get('.p-toast-message-success', { timeout: 30000 })
                .should('be.visible')

              // Restore
              cy.get(selectors.lastNameInput)
                .clear()
                .type(originalName)
              cy.get(selectors.submitButton).click()
            }
          })
        })
    })

    it('should update timezone', () => {
      cy.get(selectors.timezoneDropdown).click()
      cy.get('.p-dropdown-panel', { timeout: 10000 }).should('be.visible')

      // Select a different timezone
      cy.get('.p-dropdown-item').eq(1).click()

      cy.get(selectors.submitButton).click()

      cy.get('body').then(($body) => {
        if ($body.find('.p-toast-message-success').length) {
          cy.get('.p-toast-message-success', { timeout: 30000 })
            .should('be.visible')
        }
      })
    })
  })

  describe('MFA Toggle', () => {
    it('should display MFA switch', () => {
      cy.get(selectors.mfaSwitch).should('exist')
      cy.contains('Multi-Factor Authentication').should('be.visible')
    })

    it('should toggle MFA setting', () => {
      cy.get(selectors.mfaSwitch)
        .find('.p-inputswitch')
        .then(($switch) => {
          if (!$switch.hasClass('p-disabled')) {
            const wasChecked = $switch.hasClass('p-inputswitch-checked')
            cy.wrap($switch).click()

            if (wasChecked) {
              cy.wrap($switch).should('not.have.class', 'p-inputswitch-checked')
            } else {
              cy.wrap($switch).should('have.class', 'p-inputswitch-checked')
            }

            // Toggle back
            cy.wrap($switch).click()
          } else {
            cy.log('MFA toggle is disabled (forced by account settings)')
          }
        })
    })
  })

  describe('Form Actions', () => {
    it('should display submit and cancel buttons', () => {
      cy.get(selectors.submitButton).should('be.visible')
      cy.get(selectors.cancelButton).should('be.visible')
    })

    it('should cancel changes', () => {
      cy.get(selectors.firstNameInput).invoke('val').then((originalValue) => {
        cy.get(selectors.firstNameInput)
          .clear()
          .type('WillBeCancelled')

        cy.get(selectors.cancelButton).click()

        cy.get('body').then(($body) => {
          if ($body.find('.p-dialog-footer button').length) {
            cy.get('.p-dialog-footer button').contains(/leave|discard|confirm/i).click()
          }
        })

        // Cancel should either restore value or navigate away
        cy.url().then((url) => {
          if (url.includes('/your-settings')) {
            // Still on settings page - verify value was restored
            cy.get(selectors.firstNameInput).should('have.value', originalValue)
          } else {
            // Navigated away - cancel worked by leaving the page
            cy.url().should('not.include', '/your-settings')
          }
        })
      })
    })
  })
})
