/* eslint-disable cypress/unsafe-to-chain-command */
import selectors from '../../support/selectors'

// Fixtures
import accountInfo from '../../fixtures/template-engine/account-info.json'
import solutionsList from '../../fixtures/template-engine/solutions-list.json'
import solution from '../../fixtures/template-engine/solution.json'
import template from '../../fixtures/template-engine/template-no-settings.json'
import vcsIntegrations from '../../fixtures/template-engine/vcs-integrations.json'
import logsFailed from '../../fixtures/template-engine/logs-failed.json'

const templateEngine = selectors.templateEngine

const VENDOR_SLUG = 'azion'
const SOLUTION_SLUG = 'my-template-e2e'
const TEMPLATE_ID = 'tmpl-e2e-123'
const EXECUTION_ID = 'exec-fail-uuid'
const PROJECT_NAME = 'failure-project-e2e'
const POLL_INTERVAL_MS = 7000

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

describe('Template Engine - Deploy failure flow (mocked)', { tags: ['@dev3'] }, () => {
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

    cy.login()
    cy.wait('@getAccountInfo')
  })

  it('shows the error in the logs and does not reach the success state', () => {
    let logsCall = 0

    cy.intercept(
      { method: 'POST', pathname: `/api/template-engine/templates/${TEMPLATE_ID}/instantiate` },
      { statusCode: 201, body: { uuid: EXECUTION_ID } }
    ).as('instantiate')

    // First poll: running. Second poll: failed (with an error log).
    cy.intercept(
      { method: 'GET', pathname: `/api/script-runner/executions/${EXECUTION_ID}/logs` },
      (req) => {
        logsCall += 1
        if (logsCall >= 2) {
          req.reply(logsFailed)
        } else {
          req.reply({
            statusCode: 200,
            body: {
              status: 'running',
              logs: [{ content: 'Starting deployment', timestamp: '2026-06-10T12:00:00.000Z' }]
            }
          })
        }
      }
    ).as('getLogs')

    // Results requested on finish - return an error envelope so the app never
    // transitions to the success step.
    cy.intercept(
      { method: 'GET', pathname: `/api/script-runner/executions/${EXECUTION_ID}/results` },
      { statusCode: 200, body: { result: { errors: { message: 'Failed to provision resources' } } } }
    ).as('getResults')

    fillRepositoryStep()

    // Freeze timers to drive the logs polling
    cy.clock(null, ['setTimeout', 'setInterval'])

    cy.get(templateEngine.deployButton).should('not.be.disabled').click()
    cy.wait('@instantiate').its('response.statusCode').should('eq', 201)

    cy.get(templateEngine.deployStatusCard).should('be.visible')

    // First poll => running
    cy.tick(POLL_INTERVAL_MS)
    cy.wait('@getLogs')
    cy.get(templateEngine.deployStatusCard).should('contain', 'Starting deployment')

    // Second poll => failed
    cy.tick(POLL_INTERVAL_MS)
    cy.wait('@getLogs')
    cy.wait('@getResults')

    // Error surfaced in the logs
    cy.get(templateEngine.deployStatusCard).should('contain', 'Failed to provision resources')

    // No success transition: inputs card still present, success card not shown
    cy.get(templateEngine.inputsCard).should('be.visible')
    cy.get(templateEngine.deploySuccessCard).should('not.be.visible')
    cy.get(templateEngine.deployStatusCard).should('be.visible')
  })

  it('handles an instantiate failure without starting the polling', () => {
    cy.intercept(
      { method: 'POST', pathname: `/api/template-engine/templates/${TEMPLATE_ID}/instantiate` },
      { statusCode: 500, body: { message: 'Internal Server Error' } }
    ).as('instantiate')

    fillRepositoryStep()

    cy.get(templateEngine.deployButton).should('not.be.disabled').click()
    cy.wait('@instantiate').its('response.statusCode').should('eq', 500)

    // No execution id => logs card never renders, no success card
    cy.get(templateEngine.deployStatusCard).should('not.exist')
    cy.get(templateEngine.deploySuccessCard).should('not.be.visible')

    // Inputs remain available and the deploy can be retried
    cy.get(templateEngine.inputsCard).should('be.visible')
    cy.get(templateEngine.deployButton).should('not.be.disabled')
  })

  it('allows retrying the deploy after an instantiate failure', () => {
    let instantiateCall = 0

    cy.intercept(
      { method: 'POST', pathname: `/api/template-engine/templates/${TEMPLATE_ID}/instantiate` },
      (req) => {
        instantiateCall += 1
        if (instantiateCall === 1) {
          req.reply({ statusCode: 500, body: { message: 'Internal Server Error' } })
        } else {
          req.reply({ statusCode: 201, body: { uuid: EXECUTION_ID } })
        }
      }
    ).as('instantiate')

    // Keep polling benign on the successful retry (timers stay frozen, so it
    // never actually fires, but this prevents any real request from leaking).
    cy.intercept(
      { method: 'GET', pathname: `/api/script-runner/executions/${EXECUTION_ID}/logs` },
      { statusCode: 200, body: { status: 'running', logs: [] } }
    ).as('getLogs')

    fillRepositoryStep()

    // First attempt fails
    cy.get(templateEngine.deployButton).should('not.be.disabled').click()
    cy.wait('@instantiate').its('response.statusCode').should('eq', 500)
    cy.get(templateEngine.deployStatusCard).should('not.exist')

    // Freeze timers before the retry so the polling doesn't run real-time
    cy.clock(null, ['setTimeout', 'setInterval'])

    // Retry: second click triggers a new instantiate that succeeds
    cy.get(templateEngine.deployButton).should('not.be.disabled').click()
    cy.wait('@instantiate').its('response.statusCode').should('eq', 201)

    // Flow advances to the deployment step (logs card shown)
    cy.get(templateEngine.deployStatusCard).should('be.visible')
  })
})
