/* eslint-disable cypress/unsafe-to-chain-command */
import selectors from '../../support/selectors'

// Fixtures (no logs/results needed - validations stay on the repository step)
import accountInfo from '../../fixtures/template-engine/account-info.json'
import solutionsList from '../../fixtures/template-engine/solutions-list.json'
import solution from '../../fixtures/template-engine/solution.json'
import template from '../../fixtures/template-engine/template.json'
import vcsIntegrations from '../../fixtures/template-engine/vcs-integrations.json'

const templateEngine = selectors.templateEngine

const VENDOR_SLUG = 'azion'
const SOLUTION_SLUG = 'my-template-e2e'
const TEMPLATE_ID = 'tmpl-e2e-123'
const VALID_NAME = 'valid-project-name'
const INVALID_NAME = '!!!'

/**
 * Open the create modal, pick the mocked template and wait until the
 * repository (Start from Template) card is rendered.
 */
const openTemplateCard = () => {
  cy.get(templateEngine.navbarCreateButton).click()
  cy.get(templateEngine.modalContainer).should('be.visible')
  cy.contains(templateEngine.modalMenuItem, 'Templates').click()
  cy.get(templateEngine.modalTemplatesItem).first().click()

  cy.wait('@loadSolution')
  cy.wait('@getTemplate')
  cy.wait('@getVcsIntegrations')

  cy.get(templateEngine.gitScopeDropdown).should('be.visible')
}

const selectGitScope = () => {
  cy.get(templateEngine.gitScopeDropdown).click()
  cy.contains(templateEngine.dropdownItem, 'azion-e2e-org').click()
  cy.get(templateEngine.gitScopeDropdown).should('contain', 'azion-e2e-org')
}

describe('Template Engine - Input card validations (mocked)', { tags: ['@dev3'] }, () => {
  beforeEach(() => {
    cy.intercept(
      { method: 'GET', url: '**/api/account/info' },
      { statusCode: 200, body: accountInfo }
    ).as('getAccountInfo')

    cy.intercept(
      { method: 'GET', pathname: '/api/marketplace/solution/' },
      { statusCode: 200, body: solutionsList }
    ).as('listSolutions')

    cy.intercept(
      { method: 'GET', pathname: `/api/marketplace/solution/${VENDOR_SLUG}/${SOLUTION_SLUG}` },
      { statusCode: 200, body: solution }
    ).as('loadSolution')

    cy.intercept(
      { method: 'GET', pathname: `/api/template-engine/templates/${TEMPLATE_ID}` },
      { statusCode: 200, body: template }
    ).as('getTemplate')

    cy.intercept(
      { method: 'GET', url: '**/v4/vcs/integrations*' },
      { statusCode: 200, body: vcsIntegrations }
    ).as('getVcsIntegrations')

    // Stubbed so we can assert it is NEVER called while the form is invalid,
    // and inspect its payload on the happy-path scenarios.
    cy.intercept(
      { method: 'POST', url: '**/template-engine/templates/*/instantiate' },
      { statusCode: 201, body: { uuid: 'exec-validation' } }
    ).as('instantiate')

    // Keep success-card side calls benign (only reached on the payload scenarios)
    cy.intercept(
      { method: 'GET', pathname: '/v4/workspace/dns/zones' },
      { statusCode: 200, body: { count: 0, results: [] } }
    ).as('listDnsZones')
    cy.intercept(
      { method: 'GET', url: '**/v4/workspace/workloads/*' },
      { statusCode: 200, body: {} }
    ).as('loadWorkload')

    cy.loginMock()
    cy.wait('@getAccountInfo')
  })

  it('validates the project name (empty, invalid and corrected)', () => {
    openTemplateCard()

    // Empty name: the "Required" message is hidden by design, so the feedback
    // is the invalid input state + the blocked action button.
    cy.get(templateEngine.projectNameInput).clear().blur()
    cy.get(templateEngine.projectNameInput).should('have.class', 'p-invalid')
    cy.get(templateEngine.nextButton).should('be.disabled')

    // Invalid name: shows the schema validation message and stays blocked
    cy.get(templateEngine.projectNameInput).clear().type(INVALID_NAME).blur()
    cy.get(templateEngine.projectNameError).should('be.visible')
    cy.get(templateEngine.nextButton).should('be.disabled')

    // Corrected name: error disappears
    cy.get(templateEngine.projectNameInput).clear().type(VALID_NAME).blur()
    cy.get(templateEngine.projectNameError).should('not.exist')
  })

  it('requires a Git Scope and blocks advancing until one is selected', () => {
    openTemplateCard()

    // Valid name but no Git Scope selected -> still blocked, no deploy attempt
    cy.get(templateEngine.projectNameInput).clear().type(VALID_NAME).blur()
    cy.get(templateEngine.nextButton).should('be.disabled')
    cy.get('@instantiate.all').should('have.length', 0)

    // Selecting a Git Scope unlocks the action button
    selectGitScope()
    cy.get(templateEngine.nextButton).should('not.be.disabled')
  })

  it('keeps the privacy switch public by default and toggles to private', () => {
    openTemplateCard()

    // Default state: public
    cy.get(templateEngine.privacySwitch).should('have.attr', 'aria-pressed', 'true')
    cy.get(templateEngine.projectNameLabel).should('contain', 'Public')

    // Toggle to private
    cy.get(templateEngine.privacySwitch).click()
    cy.get(templateEngine.privacySwitch).should('have.attr', 'aria-pressed', 'false')
    cy.get(templateEngine.projectNameLabel).should('contain', 'Private')
  })

  it('blocks the settings deploy while the required setting is empty', () => {
    openTemplateCard()
    selectGitScope()
    cy.get(templateEngine.projectNameInput).clear().type(VALID_NAME)
    cy.get(templateEngine.nextButton).should('not.be.disabled').click()

    // Settings step rendered, required field empty -> deploy blocked
    cy.get(templateEngine.settingsCard).should('be.visible')
    cy.get(templateEngine.settingsDeployButton).should('be.disabled')
    cy.get('@instantiate.all').should('have.length', 0)

    // Empty + blur -> invalid state on the field
    cy.get(templateEngine.settingsPasswordInput).focus().blur()
    cy.get(templateEngine.settingsPasswordField).should('have.class', 'p-invalid')

    // Filling the required setting enables the deploy button
    cy.get(templateEngine.settingsPasswordInput).type('test-deepgram-key-123')
    cy.get(templateEngine.settingsDeployButton).should('not.be.disabled')

    // Clearing it blocks the deploy again
    cy.get(templateEngine.settingsPasswordInput).clear().blur()
    cy.get(templateEngine.settingsDeployButton).should('be.disabled')
    cy.get('@instantiate.all').should('have.length', 0)
  })

  it('sends vcs_repo_is_public=false when the project is set to private', () => {
    openTemplateCard()
    selectGitScope()
    cy.get(templateEngine.projectNameInput).clear().type(VALID_NAME)
    cy.get(templateEngine.privacySwitch).click() // public -> private

    cy.get(templateEngine.nextButton).should('not.be.disabled').click()
    cy.get(templateEngine.settingsPasswordInput).type('test-deepgram-key-123')

    // Freeze timers so the logs polling never fires after instantiate
    cy.clock(null, ['setTimeout', 'setInterval'])
    cy.get(templateEngine.settingsDeployButton).should('not.be.disabled').click()

    cy.wait('@instantiate').then(({ request }) => {
      const privacyField = request.body.find((item) => item.field === 'vcs_repo_is_public')
      expect(privacyField, 'vcs_repo_is_public payload field').to.exist
      expect(privacyField.value).to.eq(false)
    })
  })

  it('sends vcs_repo_is_public=true when the project stays public', () => {
    openTemplateCard()
    selectGitScope()
    cy.get(templateEngine.projectNameInput).clear().type(VALID_NAME)
    // Do NOT toggle the switch -> stays public

    cy.get(templateEngine.nextButton).should('not.be.disabled').click()
    cy.get(templateEngine.settingsPasswordInput).type('test-deepgram-key-123')

    cy.clock(null, ['setTimeout', 'setInterval'])
    cy.get(templateEngine.settingsDeployButton).should('not.be.disabled').click()

    cy.wait('@instantiate').then(({ request }) => {
      const privacyField = request.body.find((item) => item.field === 'vcs_repo_is_public')
      expect(privacyField, 'vcs_repo_is_public payload field').to.exist
      expect(privacyField.value).to.eq(true)
    })
  })
})
