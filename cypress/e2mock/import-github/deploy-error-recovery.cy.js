/* eslint-disable cypress/unsafe-to-chain-command */
import {
  importGithub,
  TEMPLATE_ID,
  POLL_WAIT,
  setupBaseIntercepts,
  visitImportGithub,
  fillSettingsStep
} from './helpers'

import logsRunning from '../../fixtures/template-engine/logs-running.json'
import logsFailed from '../../fixtures/template-engine/logs-failed.json'
import logsSucceeded from '../../fixtures/template-engine/logs-succeeded.json'
import resultsError from '../../fixtures/template-engine/results-error.json'
import results from '../../fixtures/template-engine/results.json'

const EXECUTION_ID = 'exec-import-recovery-uuid'
const RETRY_EXECUTION_ID = 'exec-import-retry-uuid'

describe('Import from GitHub - Deploy error recovery (mocked)', { tags: ['@dev3'] }, () => {
  beforeEach(() => {
    setupBaseIntercepts()

    // Instantiate returns a fresh uuid per call so a retry produces a new execution.
    let instantiateCall = 0
    cy.intercept(
      { method: 'POST', pathname: `/api/template-engine/templates/${TEMPLATE_ID}/instantiate` },
      (req) => {
        instantiateCall += 1
        req.reply({
          statusCode: 201,
          body: { uuid: instantiateCall === 1 ? EXECUTION_ID : RETRY_EXECUTION_ID }
        })
      }
    ).as('instantiate')

    // First execution: running then failed. Retry execution: benign running.
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

    // Results 200 with an error envelope => service throws => deploy marked failed.
    cy.intercept(
      { method: 'GET', pathname: `/api/script-runner/executions/${EXECUTION_ID}/results` },
      { statusCode: 200, body: resultsError }
    ).as('getResults')

    visitImportGithub()
  })

  const deployToFailure = () => {
    fillSettingsStep()

    cy.get(importGithub.deployButton).should('not.be.disabled').click()
    cy.wait('@instantiate').its('response.body.uuid').should('eq', EXECUTION_ID)

    cy.get(importGithub.deployStatusCard).should('be.visible')

    // First poll => running: recovery actions not shown yet (in-progress state).
    cy.wait('@getLogs', POLL_WAIT)
    cy.get(importGithub.deployRetryButton).should('not.exist')
    cy.get(importGithub.deployNewButton).should('not.exist')

    // Second poll => failed => results error => deploy marked as failed.
    cy.wait('@getLogs', POLL_WAIT)
    cy.wait('@getResults', POLL_WAIT)
  }

  it('shows recovery actions on failure and retries the deploy in place', () => {
    deployToFailure()

    cy.get(importGithub.deployRetryButton).should('be.visible')
    cy.get(importGithub.deployNewButton).should('be.visible')

    // Retry re-instantiates with the same data and the logs card streams again.
    cy.get(importGithub.deployRetryButton).click()
    cy.wait('@instantiate').its('response.body.uuid').should('eq', RETRY_EXECUTION_ID)

    cy.get(importGithub.deployStatusCard).should('be.visible')
    cy.get(importGithub.deployRetryButton).should('not.exist')
    cy.get(importGithub.deployNewButton).should('not.exist')

    // Actions must stay hidden throughout the new in-progress deploy.
    cy.wait('@getRetryLogs', POLL_WAIT)
    cy.get(importGithub.deployRetryButton).should('not.exist')
    cy.get(importGithub.deployNewButton).should('not.exist')
  })

  it('start new deploy resets the flow and re-enables the form', () => {
    deployToFailure()

    cy.get(importGithub.deployNewButton).should('be.visible').click()

    // Back to the settings step: logs card gone, form footer shown and fields enabled.
    cy.get(importGithub.deployStatusCard).should('not.be.visible')
    cy.get(importGithub.deployButton).should('be.visible')
    cy.get(importGithub.gitScopeDropdown).should('not.have.class', 'p-disabled')
    cy.get(importGithub.deployRetryButton).should('not.exist')
    cy.get(importGithub.deployNewButton).should('not.exist')

    // Starting from zero clears the persisted deploy state from the URL.
    cy.location('search').should('eq', '')
  })
})

describe('Import from GitHub - No recovery actions on success (mocked)', { tags: ['@dev3'] }, () => {
  const SUCCESS_EXECUTION_ID = 'exec-import-success-uuid'

  beforeEach(() => {
    setupBaseIntercepts()

    cy.intercept(
      { method: 'POST', pathname: `/api/template-engine/templates/${TEMPLATE_ID}/instantiate` },
      { statusCode: 201, body: { uuid: SUCCESS_EXECUTION_ID } }
    ).as('instantiate')

    let logsCall = 0
    cy.intercept(
      { method: 'GET', pathname: `/api/script-runner/executions/${SUCCESS_EXECUTION_ID}/logs` },
      (req) => {
        logsCall += 1
        req.reply(logsCall >= 2 ? logsSucceeded : logsRunning)
      }
    ).as('getLogs')

    cy.intercept(
      { method: 'GET', pathname: `/api/script-runner/executions/${SUCCESS_EXECUTION_ID}/results` },
      { statusCode: 200, body: results }
    ).as('getResults')

    cy.intercept(
      { method: 'GET', pathname: '/v4/workspace/dns/zones' },
      { statusCode: 200, body: { count: 0, results: [] } }
    ).as('listDnsZones')

    visitImportGithub()
  })

  it('does not show recovery actions when the deploy succeeds', () => {
    fillSettingsStep()

    cy.get(importGithub.deployButton).should('not.be.disabled').click()
    cy.wait('@instantiate').its('response.statusCode').should('eq', 201)

    cy.get(importGithub.deployStatusCard).should('be.visible')
    cy.wait('@getLogs', POLL_WAIT)
    cy.wait('@getLogs', POLL_WAIT)
    cy.wait('@getResults', POLL_WAIT)

    cy.get(importGithub.deploySuccessCard).should('be.visible')
    cy.get(importGithub.deployRetryButton).should('not.exist')
    cy.get(importGithub.deployNewButton).should('not.exist')
  })
})
