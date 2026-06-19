/* eslint-disable cypress/unsafe-to-chain-command */
import selectors from '../../support/selectors'

// Fixtures
import accountInfo from '../../fixtures/template-engine/account-info.json'
import solutionsList from '../../fixtures/template-engine/solutions-list.json'
import solution from '../../fixtures/template-engine/solution.json'
import template from '../../fixtures/template-engine/template-no-settings.json'
import vcsIntegrations from '../../fixtures/template-engine/vcs-integrations.json'
import logsFailedEmpty from '../../fixtures/template-engine/logs-failed-empty.json'
import resultsError from '../../fixtures/template-engine/results-error.json'
import resultsNoErrors from '../../fixtures/template-engine/results-no-errors.json'

// Logs polling answers 200 with no data at all (the adapter defaults to `logs: []`).
const logsRunningEmpty = { status: 'running', logs: [] }

const templateEngine = selectors.templateEngine

const VENDOR_SLUG = 'azion'
const SOLUTION_SLUG = 'my-template-e2e'
const TEMPLATE_ID = 'tmpl-e2e-123'
const EXECUTION_ID = 'exec-results-error-uuid'
const PROJECT_NAME = 'results-error-200-e2e'
const POLL_INTERVAL_MS = 7000

// The message lives inside the results error envelope (result.errors.message) and
// is surfaced verbatim by the error toast when the results request "succeeds" (200)
// but carries an error payload instead of real resources.
const RESULTS_ERROR_MESSAGE = resultsError.result.errors.message

const fillRepositoryStep = () => {
  cy.get(templateEngine.navbarCreateButton).click()
  cy.get(templateEngine.modalContainer).should('be.visible')
  cy.contains(templateEngine.modalMenuItem, 'Templates').click()
  cy.get(templateEngine.modalTemplatesItem).first().click()

  cy.wait('@loadSolution')
  cy.wait('@getTemplate')
  cy.wait('@getVcsIntegrations')

  cy.get(templateEngine.gitScopeDropdown).should('be.visible').click()
  cy.contains(templateEngine.dropdownItem, 'azion-e2e-org').click()
  cy.get(templateEngine.gitScopeDropdown).should('contain', 'azion-e2e-org')

  cy.get(templateEngine.projectNameInput).clear()
  cy.get(templateEngine.projectNameInput).type(PROJECT_NAME)
}

describe('Template Engine - Deploy results error on HTTP 200 (mocked)', { tags: ['@dev3'] }, () => {
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

    cy.loginMock()
    cy.wait('@getAccountInfo')
  })

  // Real-world edge case: the backend answers 200 on BOTH endpoints, but the logs
  // come back empty (the adapter defaults to `logs: []`) and the results envelope
  // carries an error message instead of provisioned resources. The deploy must NOT
  // be presented as successful - the error is surfaced and the flow stays on the
  // inputs/status step so the user can react.
  it('surfaces the error and does not reach the success state when results 200 carries an error message', () => {
    let logsCall = 0

    cy.intercept(
      { method: 'POST', pathname: `/api/template-engine/templates/${TEMPLATE_ID}/instantiate` },
      { statusCode: 201, body: { uuid: EXECUTION_ID } }
    ).as('instantiate')

    // Logs polling: first poll still running, second poll failed - both with an
    // empty `logs: []` payload (status 200) to exercise the no-data default.
    cy.intercept(
      { method: 'GET', pathname: `/api/script-runner/executions/${EXECUTION_ID}/logs` },
      (req) => {
        logsCall += 1
        req.reply({
          statusCode: 200,
          body: logsCall >= 2 ? logsFailedEmpty : logsRunningEmpty
        })
      }
    ).as('getLogs')

    // Results requested on finish: HTTP 200 but with an error envelope. The service
    // detects `result.errors` and throws, so the app surfaces a toast and never
    // transitions to the success card.
    cy.intercept(
      { method: 'GET', pathname: `/api/script-runner/executions/${EXECUTION_ID}/results` },
      { statusCode: 200, body: resultsError }
    ).as('getResults')

    fillRepositoryStep()

    // Freeze timers to drive the logs polling deterministically
    cy.clock(null, ['setTimeout', 'setInterval'])

    cy.get(templateEngine.deployButton).should('not.be.disabled').click()
    cy.wait('@instantiate').its('response.statusCode').should('eq', 201)

    cy.get(templateEngine.deployStatusCard).should('be.visible')

    // First poll => running (empty logs), 200
    cy.tick(POLL_INTERVAL_MS)
    cy.wait('@getLogs').its('response.statusCode').should('eq', 200)

    // Second poll => failed (empty logs), 200 => finish => fetch results
    cy.tick(POLL_INTERVAL_MS)
    cy.wait('@getLogs').its('response.statusCode').should('eq', 200)
    cy.wait('@getResults').its('response.statusCode').should('eq', 200)

    // The error message from the 200 results envelope is surfaced via a toast.
    // Toasts auto-dismiss, so assert it was rendered (exist), not visibility.
    cy.contains('Failed to fetch deployment results').should('exist')
    cy.contains(RESULTS_ERROR_MESSAGE).should('exist')

    // No success transition: inputs card still present, success card not shown.
    cy.get(templateEngine.inputsCard).should('be.visible')
    cy.get(templateEngine.deploySuccessCard).should('not.be.visible')
    cy.get(templateEngine.deployStatusCard).should('be.visible')
  })

  // Counterpart to the case above: same 200 results response, but WITHOUT an
  // `errors`/`error` key AND with no provisioned resources (empty result).
  //
  // EXPECTED behavior (this is the contract): an empty result means the deploy did
  // not actually succeed, so the app must surface an error and STAY on the error
  // step - it must NOT transition to the success card.
  //
  // NOTE: this currently FAILS on purpose. The view optimistically treats any
  // truthy result as success and shows the success card. The view fix should make
  // an empty result (no domain/edgeApplication) behave as an error.
  it('shows an error and stays on the step when results 200 has no errors and no provisioned resources', () => {
    let logsCall = 0

    cy.intercept(
      { method: 'POST', pathname: `/api/template-engine/templates/${TEMPLATE_ID}/instantiate` },
      { statusCode: 201, body: { uuid: EXECUTION_ID } }
    ).as('instantiate')

    // Logs polling: first poll running, second poll failed - both empty (200).
    cy.intercept(
      { method: 'GET', pathname: `/api/script-runner/executions/${EXECUTION_ID}/logs` },
      (req) => {
        logsCall += 1
        req.reply({
          statusCode: 200,
          body: logsCall >= 2 ? logsFailedEmpty : logsRunningEmpty
        })
      }
    ).as('getLogs')

    // Results: HTTP 200 with no `errors` and no resources. The view must treat
    // this as a failed deploy (nothing was provisioned).
    cy.intercept(
      { method: 'GET', pathname: `/api/script-runner/executions/${EXECUTION_ID}/results` },
      { statusCode: 200, body: resultsNoErrors }
    ).as('getResults')

    fillRepositoryStep()

    cy.clock(null, ['setTimeout', 'setInterval'])

    cy.get(templateEngine.deployButton).should('not.be.disabled').click()
    cy.wait('@instantiate').its('response.statusCode').should('eq', 201)

    cy.get(templateEngine.deployStatusCard).should('be.visible')

    // First poll => running, 200
    cy.tick(POLL_INTERVAL_MS)
    cy.wait('@getLogs').its('response.statusCode').should('eq', 200)

    // Second poll => failed (stops polling), 200 => finish => fetch results
    cy.tick(POLL_INTERVAL_MS)
    cy.wait('@getLogs').its('response.statusCode').should('eq', 200)
    cy.wait('@getResults').its('response.statusCode').should('eq', 200)

    // An error must be surfaced (empty result => failed deploy). Toasts auto-dismiss,
    // so assert it was rendered (exist), not visibility.
    cy.contains('Failed to fetch deployment results').should('exist')

    // It must NOT advance to success: success card hidden, flow stays on the step.
    cy.get(templateEngine.deploySuccessCard).should('not.be.visible')
    cy.get(templateEngine.inputsCard).should('be.visible')
    cy.get(templateEngine.deployStatusCard).should('be.visible')
  })
})
