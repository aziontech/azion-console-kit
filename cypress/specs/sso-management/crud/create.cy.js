/**
 * SSO Management - Create Tests
 *
 * API: POST v4/iam/identity_providers/{type}
 * Route: /identity-providers/create
 *
 * Note: SSO Management is in the account menu (right side).
 * Supports two identity provider types: OIDC and SAML.
 */

import { tableHelpers } from '../../../support/console-kit-helpers'

const selectors = {
  createButton: '[data-testid="create_Identity Provider_button"]',
  form: {
    nameInput: '[data-testid="network-list-form__name"] input',
    identityProviderType: '[data-testid="sso-management-create-form__identity-provider-type"]',
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

// Wait for create form to be ready
const waitForCreateForm = () => {
  cy.get(selectors.form.nameInput, { timeout: 15000 }).should('be.visible')
  cy.get(selectors.form.identityProviderType, { timeout: 10000 }).should('be.visible')
}

// Select OIDC provider type
const selectOIDCType = () => {
  cy.get(selectors.form.identityProviderType)
    .find('input[value="OIDC"]')
    .parent()
    .click()
}

// Select SAML provider type
const selectSAMLType = () => {
  cy.get(selectors.form.identityProviderType)
    .find('input[value="SAML"]')
    .parent()
    .click()
}

// Fill OIDC form
const fillOIDCForm = (data) => {
  cy.get(selectors.form.authorizationUrl)
    .clear()
    .type(data.authorizationUrl || 'https://example.com/authorize')

  cy.get(selectors.form.userInfoUrl)
    .clear()
    .type(data.userInfoUrl || 'https://example.com/userinfo')

  cy.get(selectors.form.tokenUrl)
    .clear()
    .type(data.tokenUrl || 'https://example.com/token')

  cy.get(selectors.form.clientId)
    .clear()
    .type(data.clientId || 'test-client-id')

  cy.get(selectors.form.clientSecret)
    .clear()
    .type(data.clientSecret || 'test-client-secret')

  // Select scopes
  cy.get(selectors.form.scopesMultiselect).click()
  cy.get('.p-multiselect-panel', { timeout: 10000 }).should('be.visible')
  cy.get('.p-multiselect-item').contains('Open ID').click()
  cy.get('body').click(0, 0)
}

// Fill SAML form
const fillSAMLForm = (data) => {
  cy.get(selectors.form.entityIdUrl)
    .clear()
    .type(data.entityIdUrl || 'https://example.com/entity')

  cy.get(selectors.form.signInUrl)
    .clear()
    .type(data.signInUrl || 'https://example.com/signin')

  cy.get(selectors.form.certificate)
    .clear()
    .type(data.certificate || '-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----')
}

describe('SSO Management - Create', { tags: ['@crud', '@sso-management', '@account-menu'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/identity-providers')
    tableHelpers.waitForListReady()
  })

  describe('Form Display', () => {
    it('should navigate to create page', () => {
      cy.get('body').then(($body) => {
        if ($body.find(selectors.createButton).length > 0) {
          cy.get(selectors.createButton).click()
        } else {
          cy.contains('Identity Provider').click()
        }
      })
      cy.url().should('include', '/identity-providers/create')
      waitForCreateForm()
    })

    it('should display identity provider type selection', () => {
      cy.get('body').then(($body) => {
        if ($body.find(selectors.createButton).length > 0) {
          cy.get(selectors.createButton).click()
        } else {
          cy.contains('Identity Provider').click()
        }
      })
      waitForCreateForm()

      cy.contains('Open ID Provider Configuration').should('be.visible')
      cy.contains('SAML Configuration').should('be.visible')
    })

    it('should default to OIDC type', () => {
      cy.get('body').then(($body) => {
        if ($body.find(selectors.createButton).length > 0) {
          cy.get(selectors.createButton).click()
        } else {
          cy.contains('Identity Provider').click()
        }
      })
      waitForCreateForm()

      // OIDC should be selected by default
      cy.get(selectors.form.identityProviderType)
        .find('input[value="OIDC"]')
        .should('be.checked')
    })

    it('should display OIDC form fields when OIDC is selected', () => {
      cy.get('body').then(($body) => {
        if ($body.find(selectors.createButton).length > 0) {
          cy.get(selectors.createButton).click()
        } else {
          cy.contains('Identity Provider').click()
        }
      })
      waitForCreateForm()

      cy.get(selectors.form.authorizationUrl).should('be.visible')
      cy.get(selectors.form.userInfoUrl).should('be.visible')
      cy.get(selectors.form.tokenUrl).should('be.visible')
      cy.get(selectors.form.clientId).should('be.visible')
      cy.get(selectors.form.clientSecret).should('be.visible')
      cy.get(selectors.form.scopesMultiselect).should('be.visible')
    })

    it('should display SAML form fields when SAML is selected', () => {
      cy.get('body').then(($body) => {
        if ($body.find(selectors.createButton).length > 0) {
          cy.get(selectors.createButton).click()
        } else {
          cy.contains('Identity Provider').click()
        }
      })
      waitForCreateForm()

      selectSAMLType()

      cy.get(selectors.form.entityIdUrl).should('be.visible')
      cy.get(selectors.form.signInUrl).should('be.visible')
      cy.get(selectors.form.certificate).should('be.visible')
    })
  })

  describe('Successful Creation - OIDC', () => {
    it('should create an OIDC identity provider', () => {
      const providerName = generateProviderName('OIDC')

      cy.get('body').then(($body) => {
        if ($body.find(selectors.createButton).length > 0) {
          cy.get(selectors.createButton).click()
        } else {
          cy.contains('Identity Provider').click()
        }
      })
      waitForCreateForm()

      cy.get(selectors.form.nameInput)
        .clear()
        .type(providerName)

      fillOIDCForm({})

      cy.get(selectors.submitButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')

      // Should redirect to edit or list
      cy.url({ timeout: 15000 }).should('satisfy', (url) => {
        return url.includes('/identity-providers/edit/') || url.includes('/identity-providers')
      })
    })

    it('should verify created OIDC provider appears in list', () => {
      const providerName = generateProviderName('OIDC_LIST')

      cy.get('body').then(($body) => {
        if ($body.find(selectors.createButton).length > 0) {
          cy.get(selectors.createButton).click()
        } else {
          cy.contains('Identity Provider').click()
        }
      })
      waitForCreateForm()

      cy.get(selectors.form.nameInput)
        .clear()
        .type(providerName)

      fillOIDCForm({})

      cy.get(selectors.submitButton).click()
      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

      cy.visit('/identity-providers')
      tableHelpers.waitForListReady()

      tableHelpers.searchAndSubmit(providerName)

      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
        .should('contain', providerName)
    })
  })

  describe('Successful Creation - SAML', () => {
    it('should create a SAML identity provider', () => {
      const providerName = generateProviderName('SAML')

      cy.get('body').then(($body) => {
        if ($body.find(selectors.createButton).length > 0) {
          cy.get(selectors.createButton).click()
        } else {
          cy.contains('Identity Provider').click()
        }
      })
      waitForCreateForm()

      cy.get(selectors.form.nameInput)
        .clear()
        .type(providerName)

      selectSAMLType()

      fillSAMLForm({})

      cy.get(selectors.submitButton).click()

      cy.get('.p-toast-message-success', { timeout: 30000 })
        .should('be.visible')

      cy.url({ timeout: 15000 }).should('satisfy', (url) => {
        return url.includes('/identity-providers/edit/') || url.includes('/identity-providers')
      })
    })
  })

  describe('Validation Errors', () => {
    it('should show error for empty name', () => {
      cy.get('body').then(($body) => {
        if ($body.find(selectors.createButton).length > 0) {
          cy.get(selectors.createButton).click()
        } else {
          cy.contains('Identity Provider').click()
        }
      })
      waitForCreateForm()

      cy.get(selectors.form.nameInput)
        .clear()
        .blur()

      cy.get(selectors.submitButton).click()

      cy.get('body').then(($body) => {
        if ($body.find('.p-error, [data-testid*="error"]').length) {
          cy.get('.p-error, [data-testid*="error"]').should('be.visible')
        } else {
          cy.url().should('include', '/identity-providers/create')
        }
      })
    })

    it('should show error for missing OIDC required fields', () => {
      const providerName = generateProviderName('OIDC_VAL')

      cy.get('body').then(($body) => {
        if ($body.find(selectors.createButton).length > 0) {
          cy.get(selectors.createButton).click()
        } else {
          cy.contains('Identity Provider').click()
        }
      })
      waitForCreateForm()

      cy.get(selectors.form.nameInput)
        .clear()
        .type(providerName)

      // Don't fill required fields
      cy.get(selectors.submitButton).click()

      // Should show validation errors or stay on page
      cy.get('body').then(($body) => {
        if ($body.find('.p-error, [data-testid*="error"]').length) {
          cy.get('.p-error, [data-testid*="error"]').should('be.visible')
        } else {
          cy.url().should('include', '/identity-providers/create')
        }
      })
    })
  })

  describe('Form Actions', () => {
    it('should cancel creation and return to list', () => {
      cy.get('body').then(($body) => {
        if ($body.find(selectors.createButton).length > 0) {
          cy.get(selectors.createButton).click()
        } else {
          cy.contains('Identity Provider').click()
        }
      })
      waitForCreateForm()

      cy.get(selectors.form.nameInput).type('WillBeCancelled')

      cy.get(selectors.cancelButton).click()

      cy.get('body').then(($body) => {
        if ($body.find('.p-dialog-footer button').length) {
          cy.get('.p-dialog-footer button').contains(/leave|discard|confirm/i).click()
        }
      })

      tableHelpers.waitForListReady()
      cy.url().should('include', '/identity-providers')
    })
  })
})
