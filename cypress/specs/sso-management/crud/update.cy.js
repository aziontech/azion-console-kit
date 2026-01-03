/**
 * SSO Management - Update Tests
 *
 * API: PATCH v4/iam/identity_providers/{type}/{id}
 * Route: /identity-providers/edit/:protocol/:id
 *
 * Note: SSO Management is in the account menu (right side).
 * Edit page displays additional read-only URLs (Login URL, Redirect URL, etc.)
 */

import { tableHelpers } from '../../../support/console-kit-helpers'

const selectors = {
  createButton: '[data-testid="create_Identity Provider_button"]',
  form: {
    nameInput: '[data-testid="network-list-form__name"] input',
    identityProviderType: '[data-testid="sso-management-create-form__identity-provider-type"]',
    // Read-only fields in edit mode
    loginUrl: '[data-testid="sso-management-form__login-url"] input',
    redirectUrl: '[data-testid="sso-management-form__redirect-url"] input',
    // OIDC fields
    authorizationUrl: '[data-testid="sso-management-form__subject-name"] input',
    userInfoUrl: '[data-testid="sso-management-form__userinfo-url"] input',
    tokenUrl: '[data-testid="sso-management-form__token-url"] input',
    clientId: '[data-testid="sso-management-form__client-id"] input',
    clientSecret: '[data-testid="sso-management-form__client-secret"]',
    scopesMultiselect: '[data-testid="sso-management-form__scopes__multiselect"]',
    // SAML fields
    entityIdUrl: '[data-testid="sso-management-form__idp-entity-id-url"] input',
    signInUrl: '[data-testid="sso-management-form__idp-sign-in-url"] input',
    certificate: '[data-testid="sso-management-form__certificate-field"] textarea'
  },
  submitButton: '[data-testid="form-actions-submit-button"]',
  cancelButton: '[data-testid="form-actions-cancel-button"]'
}

const generateProviderName = (prefix = 'IdP') => {
  return `${prefix}_${Date.now()}`
}

// Helper to check if list has data
const hasListData = () => {
  return cy.get('body').then(($body) => {
    const hasTable = $body.find('.p-datatable').length > 0
    const hasRows = $body.find('[data-testid*="list-table-block__column__name"]').length > 0
    return hasTable && hasRows
  })
}

// Wait for edit form to be ready
const waitForEditForm = () => {
  cy.get(selectors.form.nameInput, { timeout: 15000 }).should('be.visible')
}

// Create an OIDC provider for testing
const createOIDCProviderForUpdate = (name) => {
  cy.get('body').then(($body) => {
    if ($body.find(selectors.createButton).length > 0) {
      cy.get(selectors.createButton).click()
    } else {
      cy.contains('Identity Provider').click()
    }
  })

  cy.get(selectors.form.nameInput, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(name)

  cy.get(selectors.form.authorizationUrl)
    .clear()
    .type('https://example.com/authorize')

  cy.get(selectors.form.userInfoUrl)
    .clear()
    .type('https://example.com/userinfo')

  cy.get(selectors.form.tokenUrl)
    .clear()
    .type('https://example.com/token')

  cy.get(selectors.form.clientId)
    .clear()
    .type('test-client-id')

  cy.get(selectors.form.clientSecret)
    .clear()
    .type('test-client-secret')

  // Select scopes
  cy.get(selectors.form.scopesMultiselect).click()
  cy.get('.p-multiselect-panel', { timeout: 10000 }).should('be.visible')
  cy.get('.p-multiselect-item').contains('Open ID').click()
  cy.get('body').click(0, 0)

  cy.get(selectors.submitButton).click()
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

  cy.visit('/identity-providers')
  tableHelpers.waitForListReady()
}

describe('SSO Management - Update', { tags: ['@crud', '@sso-management', '@account-menu'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/identity-providers')
    tableHelpers.waitForListReady()
  })

  describe('Edit Navigation', () => {
    it('should navigate to edit page when clicking a row', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          cy.get('[data-testid*="list-table-block__column__name"]')
            .first()
            .click()

          cy.url({ timeout: 15000 }).should('include', '/identity-providers/edit/')
          waitForEditForm()
        } else {
          cy.log('No identity providers - creating one for test')
          const providerName = generateProviderName('UPDATE_NAV')
          createOIDCProviderForUpdate(providerName)

          cy.get('[data-testid*="list-table-block__column__name"]')
            .first()
            .click()
          cy.url({ timeout: 15000 }).should('include', '/identity-providers/edit/')
        }
      })
    })
  })

  describe('Edit Form Display', () => {
    it('should display read-only URLs in edit mode', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          cy.get('[data-testid*="list-table-block__column__name"]')
            .first()
            .click()

          waitForEditForm()

          // Read-only fields should be visible and disabled
          cy.get(selectors.form.loginUrl)
            .should('be.visible')
            .and('have.attr', 'readonly')
        } else {
          cy.log('No identity providers - skipping test')
        }
      })
    })

    it('should disable identity provider type selection in edit mode', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          cy.get('[data-testid*="list-table-block__column__name"]')
            .first()
            .click()

          waitForEditForm()

          // Type selection should be disabled
          cy.get(selectors.form.identityProviderType)
            .find('input')
            .should('be.disabled')
        } else {
          cy.log('No identity providers - skipping test')
        }
      })
    })
  })

  describe('Successful Update', () => {
    it('should update identity provider name', () => {
      const originalName = generateProviderName('UPDATE_ORIG')
      const updatedName = generateProviderName('UPDATE_NEW')

      createOIDCProviderForUpdate(originalName)

      tableHelpers.searchAndSubmit(originalName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(originalName)
        .click()

      waitForEditForm()

      cy.get(selectors.form.nameInput)
        .clear()
        .type(updatedName)

      cy.get(selectors.submitButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')

      cy.visit('/identity-providers')
      tableHelpers.waitForListReady()
      tableHelpers.searchAndSubmit(updatedName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', updatedName)
    })

    it('should update OIDC provider URLs', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          // Find an OIDC provider
          cy.get('body').then(($body) => {
            if ($body.find('[data-testid*="list-table-block__column__protocol"]').text().includes('OIDC')) {
              cy.get('[data-testid*="list-table-block__column__name"]')
                .first()
                .click()

              waitForEditForm()

              const newUrl = 'https://updated-example.com/authorize'
              cy.get(selectors.form.authorizationUrl)
                .clear()
                .type(newUrl)

              cy.get(selectors.submitButton).click()

              cy.get('.p-toast-message-success', { timeout: 30000 })
                .should('be.visible')
            } else {
              cy.log('No OIDC provider found - skipping test')
            }
          })
        } else {
          cy.log('No identity providers - skipping test')
        }
      })
    })
  })

  describe('Form Validation', () => {
    it('should prevent saving with empty name', () => {
      hasListData().then((hasData) => {
        if (hasData) {
          cy.get('[data-testid*="list-table-block__column__name"]')
            .first()
            .click()

          waitForEditForm()

          cy.get(selectors.form.nameInput)
            .clear()
            .blur()

          cy.get(selectors.submitButton).click()

          cy.get('body').then(($body) => {
            if ($body.find('.p-error, [data-testid*="error"]').length) {
              cy.get('.p-error, [data-testid*="error"]').should('be.visible')
            } else {
              cy.url().should('include', '/identity-providers/edit/')
            }
          })
        } else {
          cy.log('No identity providers - skipping validation test')
        }
      })
    })
  })
})
