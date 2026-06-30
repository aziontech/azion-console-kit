// Selectors for the additional-data onboarding form. Each radio option renders a
// <label for="{nameField}-radio-{index}"> bound to a hidden radio input, so
// clicking the label is the reliable way to select an option (clicking the card
// wrapper lands on padding and does not toggle the radio). Selecting `use` then
// `role` is also what advances the form's step gating and enables `fullName`.
const selectors = {
  usePersonalOption: 'label[for="use-radio-0"]',
  roleSoftwareDeveloperOption: 'label[for="role-radio-0"]',
  fullNameInput: '#fullName',
  submitButton: '[data-testid="form-actions-buttons"] button'
}

const accountInfo = {
  id: 22692,
  name: 'Cypress User',
  company_name: 'Azion',
  full_name: 'Cypress User',
  kind: 'client',
  client_flags: ['allow_console'],
  first_login: true,
  is_client_only: true,
  status: 'ONLINE'
}

const userInfo = {
  id: 9999,
  email: 'cypress.user@azion.com',
  first_name: 'Cypress',
  last_name: 'User',
  is_account_owner: true,
  client_id: 4321,
  timezone: 'America/Sao_Paulo',
  utc_offset: '-0300',
  permissions: []
}

const jobRoleResponse = { data: { job_function: 'software-developer' } }

// Persisted pinia state (account store) used to fake an authenticated session
// without hitting the real auth backend. The account store persists only these
// paths (see src/stores/account.js).
const persistedAccountState = {
  identifySignUpProvider: '',
  hasSession: true,
  signupTypeFlags: {
    login_sso_google: false,
    login_sso_github: false,
    login_email: false,
    signup_sso_google: false,
    signup_sso_github: false,
    signup_email: true
  }
}

/**
 * Registers all the intercepts needed to render the onboarding additional-data
 * step and submit it. The HubSpot endpoint status code is configurable so we can
 * assert that the onboarding flow is resilient to both success (200) and error
 * (400) responses.
 *
 * @param {Object} options
 * @param {number} options.hubspotStatusCode - status code returned by the mocked HubSpot endpoint
 */
const setupIntercepts = ({ hubspotStatusCode }) => {
  // Account hydration (account guard / loadUserAndAccountInfo)
  cy.intercept('GET', '**/account/info', { statusCode: 200, body: accountInfo }).as('accountInfo')
  cy.intercept('GET', '**/user/me', { statusCode: 200, body: userInfo }).as('userInfo')
  cy.intercept('GET', '**/v4/iam/account', { statusCode: 200, body: jobRoleResponse }).as('jobRole')

  // Submit services
  cy.intercept('PATCH', '**/v4/iam/account', {
    statusCode: 200,
    body: { data: { job_function: 'software-developer' } }
  }).as('updateAccount')
  cy.intercept('PATCH', '**/v4/iam/user', { statusCode: 200, body: {} }).as('patchFullname')
  cy.intercept('POST', '**/v4/iam/users/*/additional_data', { statusCode: 201, body: {} }).as(
    'postAdditionalData'
  )

  // HubSpot event (cross-origin to www.azion.com by default)
  cy.intercept('POST', '**/hubspot/events', {
    statusCode: hubspotStatusCode,
    body: hubspotStatusCode >= 400 ? { error: 'bad request' } : { success: true }
  }).as('hubspotEvent')
}

const visitOnboarding = () => {
  cy.visit('/signup/additional-data', {
    onBeforeLoad(win) {
      win.localStorage.setItem('account', JSON.stringify(persistedAccountState))
    }
  })
}

const fillAndSubmitForm = () => {
  cy.get(selectors.usePersonalOption).click()
  cy.get(selectors.roleSoftwareDeveloperOption).click()
  // Selecting `use` + `role` advances the step gating; wait until `fullName`
  // becomes enabled before typing.
  cy.get(selectors.fullNameInput).should('not.be.disabled').type('Cypress User')
  cy.get(selectors.submitButton).click()
}

describe('Signup - additional data HubSpot event', { tags: ['@dev2'] }, () => {
  it('fires the HubSpot sign-up event and finishes onboarding when HubSpot returns 200', () => {
    setupIntercepts({ hubspotStatusCode: 200 })

    visitOnboarding()
    fillAndSubmitForm()

    // The additional data is persisted...
    cy.wait('@postAdditionalData')
    // ...and the HubSpot event is fired with a sign-up payload.
    cy.wait('@hubspotEvent').its('request.body').should('include', { eventName: 'sign_up' })
    // The flow always finishes by redirecting the user to the home page.
    cy.location('pathname').should('eq', '/')
  })

  it('still finishes onboarding when the HubSpot event fails with 400', () => {
    setupIntercepts({ hubspotStatusCode: 400 })

    visitOnboarding()
    fillAndSubmitForm()

    cy.wait('@postAdditionalData')
    // The HubSpot endpoint is still called, even though it responds with 400.
    cy.wait('@hubspotEvent').its('response.statusCode').should('eq', 400)
    // A failing HubSpot request must not block the onboarding flow.
    cy.location('pathname').should('eq', '/')
  })
})
