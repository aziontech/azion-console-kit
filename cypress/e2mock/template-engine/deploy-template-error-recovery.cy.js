/* eslint-disable cypress/unsafe-to-chain-command */
import selectors from '../../support/selectors'

// Fixtures
import accountInfo from '../../fixtures/template-engine/account-info.json'
import solutionsList from '../../fixtures/template-engine/solutions-list.json'
import solution from '../../fixtures/template-engine/solution.json'
import noSettingsTemplate from '../../fixtures/template-engine/template-no-settings.json'
import azionTemplate from '../../fixtures/template-engine/template-azion-multiple-settings.json'
import vcsIntegrations from '../../fixtures/template-engine/vcs-integrations.json'
import logsFailed from '../../fixtures/template-engine/logs-failed.json'
import resultsError from '../../fixtures/template-engine/results-error.json'

const templateEngine = selectors.templateEngine

const VENDOR_SLUG = 'azion'
const SOLUTION_SLUG = 'my-template-e2e'
const TEMPLATE_ID = 'tmpl-e2e-123'
const EXECUTION_ID = 'exec-fail-uuid'
const RETRY_EXECUTION_ID = 'exec-retry-uuid'
const PROJECT_NAME = 'recovery-project-e2e'
const POLL_INTERVAL_MS = 7000

const logsRunning = {
  status: 'running',
  logs: [{ content: 'Starting deployment', timestamp: '2026-06-10T12:00:00.000Z' }]
}

const setupCommonIntercepts = () => {
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
    { method: 'GET', url: '**/v4/vcs/integrations*' },
    { statusCode: 200, body: vcsIntegrations }
  ).as('getVcsIntegrations')
}

// Instantiate returns a fresh uuid per call so a retry produces a new execution.
const interceptInstantiate = () => {
  let call = 0
  cy.intercept(
    { method: 'POST', pathname: `/api/template-engine/templates/${TEMPLATE_ID}/instantiate` },
    (req) => {
      call += 1
      req.reply({ statusCode: 201, body: { uuid: call === 1 ? EXECUTION_ID : RETRY_EXECUTION_ID } })
    }
  ).as('instantiate')
}

// First execution: running then failed. Retry execution: benign running (timers
// stay frozen so it never actually polls past the first tick).
const interceptLogsAndResults = () => {
  let logsCall = 0
  cy.intercept(
    { method: 'GET', pathname: `/api/script-runner/executions/${EXECUTION_ID}/logs` },
    (req) => {
      logsCall += 1
      req.reply({ statusCode: 200, body: logsCall >= 2 ? logsFailed : logsRunning })
    }
  ).as('getLogs')

  cy.intercept(
    { method: 'GET', pathname: `/api/script-runner/executions/${RETRY_EXECUTION_ID}/logs` },
    { statusCode: 200, body: logsRunning }
  ).as('getRetryLogs')

  cy.intercept(
    { method: 'GET', pathname: `/api/script-runner/executions/${EXECUTION_ID}/results` },
    { statusCode: 200, body: resultsError }
  ).as('getResults')
}

const openTemplateCard = () => {
  cy.get(templateEngine.navbarCreateButton).click()
  cy.get(templateEngine.modalContainer).should('be.visible')
  cy.contains(templateEngine.modalMenuItem, 'Templates').click()
  cy.get(templateEngine.modalTemplatesItem).first().click()

  cy.wait('@loadSolution')
  cy.wait('@getTemplate')
  cy.wait('@getVcsIntegrations')
}

// Drives the jsonform (no-settings) repository step and clicks Deploy, then
// advances polling to the failed state.
const driveJsonFormToFailure = () => {
  openTemplateCard()

  cy.get(templateEngine.gitScopeDropdown).should('be.visible').click()
  cy.contains(templateEngine.dropdownItem, 'azion-e2e-org').click()
  cy.get(templateEngine.projectNameInput).clear()
  cy.get(templateEngine.projectNameInput).type(PROJECT_NAME)

  cy.clock(null, ['setTimeout', 'setInterval'])

  cy.get(templateEngine.deployButton).should('not.be.disabled').click()
  cy.wait('@instantiate').its('response.statusCode').should('eq', 201)

  cy.get(templateEngine.deployStatusCard).should('be.visible')

  // First poll => running: no recovery actions yet (in-progress state).
  cy.tick(POLL_INTERVAL_MS)
  cy.wait('@getLogs')
  cy.get(templateEngine.deployRetryButton).should('not.exist')
  cy.get(templateEngine.deployNewButton).should('not.exist')

  // Second poll => failed => results error => deploy marked as failed.
  cy.tick(POLL_INTERVAL_MS)
  cy.wait('@getLogs')
  cy.wait('@getResults')
}

describe('Template Engine - Deploy error recovery (mocked)', { tags: ['@dev3'] }, () => {
  beforeEach(() => {
    setupCommonIntercepts()
    cy.intercept(
      { method: 'GET', pathname: `/api/template-engine/templates/${TEMPLATE_ID}` },
      { statusCode: 200, body: noSettingsTemplate }
    ).as('getTemplate')

    cy.loginMock()
    cy.wait('@getAccountInfo')
  })

  it('shows recovery actions on failure and retries the deploy in place', () => {
    interceptInstantiate()
    interceptLogsAndResults()

    driveJsonFormToFailure()

    // Both recovery actions are shown in the logs card footer.
    cy.get(templateEngine.deployRetryButton).should('be.visible')
    cy.get(templateEngine.deployNewButton).should('be.visible')

    // Retry: re-instantiates with the same data and the logs card streams again.
    cy.get(templateEngine.deployRetryButton).click()
    cy.wait('@instantiate').its('response.body.uuid').should('eq', RETRY_EXECUTION_ID)

    cy.get(templateEngine.deployStatusCard).should('be.visible')
    // Failed state cleared => actions hidden again while the retry runs.
    cy.get(templateEngine.deployRetryButton).should('not.exist')
    cy.get(templateEngine.deployNewButton).should('not.exist')

    // Actions must stay hidden throughout the new in-progress deploy.
    cy.tick(POLL_INTERVAL_MS)
    cy.wait('@getRetryLogs')
    cy.get(templateEngine.deployRetryButton).should('not.exist')
    cy.get(templateEngine.deployNewButton).should('not.exist')
  })

  it('start new deploy resets the form and re-enables the fields', () => {
    interceptInstantiate()
    interceptLogsAndResults()

    driveJsonFormToFailure()

    cy.get(templateEngine.deployNewButton).should('be.visible').click()

    // Back to the repository step: logs card gone, inputs card enabled again,
    // recovery actions gone, and the project name field reset.
    cy.get(templateEngine.deployStatusCard).should('not.exist')
    cy.get(templateEngine.inputsCard).should('be.visible')
    cy.get(templateEngine.deployRetryButton).should('not.exist')
    cy.get(templateEngine.deployNewButton).should('not.exist')
    cy.get(templateEngine.projectNameInput).should('not.be.disabled').and('have.value', '')

    // Starting from zero clears the persisted deploy state from the URL.
    cy.location('search').should('eq', '')
  })

  it('exposes the same recovery flow on the Azion engine', () => {
    // Override the template with the groups-based (Azion) schema.
    cy.intercept(
      { method: 'GET', pathname: `/api/template-engine/templates/${TEMPLATE_ID}` },
      { statusCode: 200, body: azionTemplate }
    ).as('getTemplate')

    interceptInstantiate()
    interceptLogsAndResults()

    openTemplateCard()

    // Repository step (Azion engine uses its own git scope dropdown and the
    // az_name field for the application name).
    cy.get(templateEngine.azionGitScopeDropdown).should('be.visible').click()
    cy.contains(templateEngine.dropdownItem, 'azion-e2e-org').click()
    cy.get(templateEngine.azionAppNameInput).clear()
    cy.get(templateEngine.azionAppNameInput).type(PROJECT_NAME)

    // This template has settings => advance to settings and deploy from there.
    cy.get(templateEngine.nextButton).should('not.be.disabled').click()
    cy.get(templateEngine.settingsCard).should('be.visible')

    // Fake only setInterval (used by the log polling). The Azion engine validates
    // via vee-validate, whose deploy-time validation resolves through a setTimeout
    // debounce; freezing setTimeout would stall validateForm() and the deploy would
    // never reach the instantiate request. The jsonform engine validates synchronously,
    // which is why the other tests can safely freeze both timers.
    cy.clock(null, ['setInterval'])

    cy.get(templateEngine.settingsDeployButton).should('not.be.disabled').click()
    cy.wait('@instantiate').its('response.statusCode').should('eq', 201)

    cy.get(templateEngine.deployStatusCard).should('be.visible')
    cy.tick(POLL_INTERVAL_MS)
    cy.wait('@getLogs')
    cy.tick(POLL_INTERVAL_MS)
    cy.wait('@getLogs')
    cy.wait('@getResults')

    // Recovery actions appear; Start new deploy returns to the enabled form.
    cy.get(templateEngine.deployRetryButton).should('be.visible')
    cy.get(templateEngine.deployNewButton).should('be.visible').click()

    cy.get(templateEngine.deployStatusCard).should('not.exist')
    cy.get(templateEngine.inputsCard).should('be.visible')
    cy.get(templateEngine.azionAppNameInput).should('not.be.disabled').and('have.value', '')
  })
})
