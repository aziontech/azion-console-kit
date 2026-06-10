/* eslint-disable cypress/unsafe-to-chain-command */
import selectors from '../../support/selectors'

// Fixtures
import accountInfo from '../../fixtures/template-engine/account-info.json'
import solutionsList from '../../fixtures/template-engine/solutions-list.json'
import solution from '../../fixtures/template-engine/solution.json'
import template from '../../fixtures/template-engine/template-with-settings.json'
import vcsIntegrations from '../../fixtures/template-engine/vcs-integrations.json'
import logsRunning from '../../fixtures/template-engine/logs-running.json'
import logsSucceeded from '../../fixtures/template-engine/logs-succeeded.json'
import instantiate from '../../fixtures/template-engine/instantiate.json'
import results from '../../fixtures/template-engine/results.json'

const templateEngine = selectors.templateEngine

// Identifiers shared between fixtures and intercept matchers
const VENDOR_SLUG = 'azion'
const SOLUTION_SLUG = 'my-template-e2e'
const TEMPLATE_ID = 'tmpl-e2e-123'
const EXECUTION_ID = 'exec-e2e-uuid'
const PROJECT_NAME = 'template-settings-e2e'
const ENVIRONMENT_VALUE = 'production'
const MOCKED_DOMAIN = 'meu-projeto-e2e.azionedge.net'
const POLL_INTERVAL_MS = 7000

describe('Template Engine - Deploy via Settings success flow (mocked)', { tags: ['@dev3'] }, () => {
  let logsCallCount

  beforeEach(() => {
    logsCallCount = 0

    // Account: needs kind === 'client' so the create modal can open
    cy.intercept(
      { method: 'GET', url: '**/api/account/info' },
      { statusCode: 200, body: accountInfo }
    ).as('getAccountInfo')

    // Solutions list used by the create modal (recommended/templates/githubImport)
    cy.intercept(
      { method: 'GET', pathname: '/api/marketplace/solution/' },
      { statusCode: 200, body: solutionsList }
    ).as('listSolutions')

    // Selected solution (loaded by CreateView on /create/:vendor/:solution)
    cy.intercept(
      { method: 'GET', pathname: `/api/marketplace/solution/${VENDOR_SLUG}/${SOLUTION_SLUG}` },
      { statusCode: 200, body: solution }
    ).as('loadSolution')

    // Template definition (has a settings field => "Next" button + settings step)
    cy.intercept(
      { method: 'GET', pathname: `/api/template-engine/templates/${TEMPLATE_ID}` },
      { statusCode: 200, body: template }
    ).as('getTemplate')

    // GitHub integrations to populate the Git Scope dropdown
    cy.intercept(
      { method: 'GET', url: '**/v4/vcs/integrations*' },
      { statusCode: 200, body: vcsIntegrations }
    ).as('getVcsIntegrations')

    // Trailing calls made by the success card (kept benign to avoid real requests)
    cy.intercept(
      { method: 'GET', pathname: '/v4/workspace/dns/zones' },
      { statusCode: 200, body: { count: 0, results: [] } }
    ).as('listDnsZones')

    cy.intercept(
      { method: 'GET', url: '**/v4/workspace/workloads/*' },
      { statusCode: 200, body: {} }
    ).as('loadWorkload')

    cy.login()
    cy.wait('@getAccountInfo')
  })

  it('advances to settings, deploys from there and reaches the success state', () => {
    // Deploy creation endpoint - returns the execution id. Delayed so the
    // Deploy button stays in its loading/disabled state long enough to assert.
    cy.intercept(
      { method: 'POST', pathname: `/api/template-engine/templates/${TEMPLATE_ID}/instantiate` },
      { statusCode: 201, body: instantiate, delay: 700 }
    ).as('instantiate')

    // Logs polling: first poll is still running, second poll succeeded.
    cy.intercept(
      { method: 'GET', pathname: `/api/script-runner/executions/${EXECUTION_ID}/logs` },
      (req) => {
        logsCallCount += 1
        req.reply(logsCallCount >= 2 ? logsSucceeded : logsRunning)
      }
    ).as('getLogs')

    // Deployment results fetched once polling reports success
    cy.intercept(
      { method: 'GET', pathname: `/api/script-runner/executions/${EXECUTION_ID}/results` },
      { statusCode: 200, body: results }
    ).as('getResults')

    // 1. Open the create modal from the navbar
    cy.get(templateEngine.navbarCreateButton).click()
    cy.get(templateEngine.modalContainer).should('be.visible')

    // 2. Templates tab + select the mocked template
    cy.contains(templateEngine.modalMenuItem, 'Templates').click()
    cy.get(templateEngine.modalTemplatesItem).first().click()

    // 3. Inputs screen loads on the same route (/create/:vendor/:solution)
    cy.wait('@loadSolution')
    cy.wait('@getTemplate')
    cy.wait('@getVcsIntegrations')

    // 4. Git Scope: open the dropdown and select the mocked integration
    cy.get(templateEngine.gitScopeDropdown).should('be.visible').click()
    cy.contains(templateEngine.dropdownItem, 'azion-e2e-org').click()
    cy.get(templateEngine.gitScopeDropdown).should('contain', 'azion-e2e-org')

    // 5. Project name
    cy.get(templateEngine.projectNameInput).clear()
    cy.get(templateEngine.projectNameInput).type(PROJECT_NAME)

    // 6. Privacy switch: starts public, toggle to private
    cy.get(templateEngine.privacySwitch)
      .should('have.attr', 'aria-pressed', 'true')
      .click()
    cy.get(templateEngine.privacySwitch).should('have.attr', 'aria-pressed', 'false')

    // 7. The template has settings => the footer shows "Next"
    cy.get(templateEngine.nextButton).should('be.visible').and('not.be.disabled').click()

    // 8. Settings step is rendered
    cy.get(templateEngine.settingsCard).should('be.visible')
    cy.get(templateEngine.settingsEnvironmentField).should('be.visible')

    // 9. Fill the settings field
    cy.get(templateEngine.settingsEnvironmentInput).clear()
    cy.get(templateEngine.settingsEnvironmentInput).type(ENVIRONMENT_VALUE)

    // Freeze timers before deploy so we can drive the logs polling deterministically
    cy.clock(null, ['setTimeout', 'setInterval'])

    // 10. Deploy from the settings card
    cy.get(templateEngine.settingsDeployButton).should('not.be.disabled').click()

    // 11. Deploy button is loading/disabled while the request is in-flight
    cy.get(templateEngine.settingsDeployButton).should('be.disabled')

    // 12. Payload reflects the filled settings and the chosen privacy state
    cy.wait('@instantiate').then(({ request, response }) => {
      expect(response.statusCode).to.eq(201)

      const environmentField = request.body.find((entry) => entry.field === 'environment')
      expect(environmentField, 'environment payload field').to.exist
      expect(environmentField.value).to.eq(ENVIRONMENT_VALUE)

      const privacyField = request.body.find((entry) => entry.field === 'vcs_repo_is_public')
      expect(privacyField, 'vcs_repo_is_public payload field').to.exist
      expect(privacyField.value).to.eq(false)
    })

    // 13. Logs card appears
    cy.get(templateEngine.deployStatusCard).should('be.visible')

    // 14. First poll => running logs
    cy.tick(POLL_INTERVAL_MS)
    cy.wait('@getLogs')
    cy.get(templateEngine.deployStatusCard).should('contain', 'Cloning repository')

    // 15. Second poll => succeeded => finish => fetch results => success step
    cy.tick(POLL_INTERVAL_MS)
    cy.wait('@getLogs')
    cy.wait('@getResults')

    // 16. Final state: inputs card gone, logs + success cards visible
    cy.get(templateEngine.inputsCard).should('not.exist')
    cy.get(templateEngine.deployStatusCard).should('be.visible')
    cy.get(templateEngine.deploySuccessCard).should('be.visible')

    cy.get(templateEngine.deploySuccessUrl)
      .should('have.attr', 'target', '_blank')
      .and('have.attr', 'href')
      .and('include', MOCKED_DOMAIN)
  })
})
