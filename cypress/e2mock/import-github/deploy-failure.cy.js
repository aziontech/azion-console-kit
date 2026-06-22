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
import resultsError from '../../fixtures/template-engine/results-error.json'

const EXECUTION_ID = 'exec-import-github-fail'

// Old instantiate/results services map error status codes to these messages.
const INTERNAL_ERROR_MESSAGE = 'Something went wrong, please try again.'

describe('Import from GitHub - Deploy failure flow (mocked)', { tags: ['@dev3'] }, () => {
  beforeEach(() => {
    setupBaseIntercepts()
    visitImportGithub()
  })

  it('shows the failure in the logs and never reaches the success state', () => {
    let logsCall = 0

    cy.intercept(
      { method: 'POST', pathname: `/api/template-engine/templates/${TEMPLATE_ID}/instantiate` },
      { statusCode: 201, body: { uuid: EXECUTION_ID } }
    ).as('instantiate')

    // First poll running, second poll failed (with an error log line).
    cy.intercept(
      { method: 'GET', pathname: `/api/script-runner/executions/${EXECUTION_ID}/logs` },
      (req) => {
        logsCall += 1
        req.reply(logsCall >= 2 ? logsFailed : logsRunning)
      }
    ).as('getLogs')

    // Results envelope carries an error -> service throws -> deploy marked failed.
    cy.intercept(
      { method: 'GET', pathname: `/api/script-runner/executions/${EXECUTION_ID}/results` },
      { statusCode: 200, body: resultsError }
    ).as('getResults')

    fillSettingsStep()

    cy.get(importGithub.deployButton).should('not.be.disabled').click()
    cy.wait('@instantiate').its('response.statusCode').should('eq', 201)

    cy.get(importGithub.deployStatusCard).should('be.visible')

    // First poll => running
    cy.wait('@getLogs', POLL_WAIT)
    cy.get(importGithub.deployStatusCard).should('contain', 'Starting deployment')

    // Second poll => failed => finish => fetch results (error)
    cy.wait('@getLogs', POLL_WAIT)
    cy.wait('@getResults', POLL_WAIT)

    // Error surfaced in the logs; no success transition.
    cy.get(importGithub.deployStatusCard).should('contain', 'Error: Failed to provision resources')
    cy.contains('Deployment failed').should('exist')
    cy.get(importGithub.deploySuccessCard).should('not.be.visible')
    cy.get(importGithub.deployStatusCard).should('be.visible')
  })

  it('handles an instantiate failure without starting the polling', () => {
    cy.intercept(
      { method: 'POST', pathname: `/api/template-engine/templates/${TEMPLATE_ID}/instantiate` },
      { statusCode: 500, body: { message: 'Internal Server Error' } }
    ).as('instantiate')

    fillSettingsStep()

    cy.get(importGithub.deployButton).should('not.be.disabled').click()
    cy.wait('@instantiate').its('response.statusCode').should('eq', 500)

    // Generic error surfaced; no deploy started; form remains and stays recoverable.
    // The deploy status card is rendered with v-show, so it stays in the DOM but
    // must remain hidden (not transitioned to the deploying step).
    cy.contains(INTERNAL_ERROR_MESSAGE).should('exist')
    cy.get(importGithub.deployStatusCard).should('not.be.visible')
    cy.get(importGithub.deploySuccessCard).should('not.be.visible')
    cy.get(importGithub.deployButton).should('not.be.disabled')
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

    // Keep polling benign on the successful retry.
    cy.intercept(
      { method: 'GET', pathname: `/api/script-runner/executions/${EXECUTION_ID}/logs` },
      { statusCode: 200, body: { status: 'running', logs: [] } }
    ).as('getLogs')

    fillSettingsStep()

    // First attempt fails
    cy.get(importGithub.deployButton).should('not.be.disabled').click()
    cy.wait('@instantiate').its('response.statusCode').should('eq', 500)
    cy.get(importGithub.deployStatusCard).should('not.be.visible')

    // Retry: second click triggers a new instantiate that succeeds
    cy.get(importGithub.deployButton).should('not.be.disabled').click()
    cy.wait('@instantiate').its('response.statusCode').should('eq', 201)

    // Flow advances to the deployment step
    cy.get(importGithub.deployStatusCard).should('be.visible')
  })
})
