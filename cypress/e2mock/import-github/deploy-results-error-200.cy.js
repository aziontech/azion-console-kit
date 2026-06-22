/* eslint-disable cypress/unsafe-to-chain-command */
import {
  importGithub,
  TEMPLATE_ID,
  POLL_WAIT,
  setupBaseIntercepts,
  visitImportGithub,
  fillSettingsStep
} from './helpers'

import logsFailedEmpty from '../../fixtures/template-engine/logs-failed-empty.json'
import resultsError from '../../fixtures/template-engine/results-error.json'
import resultsNoErrors from '../../fixtures/template-engine/results-no-errors.json'

// Logs polling answers 200 with no data at all (the adapter defaults to `logs: []`).
const logsRunningEmpty = { status: 'running', logs: [] }

const EXECUTION_ID = 'exec-import-github-uuid'
const RESULTS_ERROR_MESSAGE = resultsError.result.errors.message

describe('Import from GitHub - Deploy results error on HTTP 200 (mocked)', { tags: ['@dev3'] }, () => {
  let logsCall

  beforeEach(() => {
    logsCall = 0
    setupBaseIntercepts()

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

    visitImportGithub()
  })

  const deployAndDrivePolling = () => {
    cy.get(importGithub.deployButton).should('not.be.disabled').click()
    cy.wait('@instantiate').its('response.statusCode').should('eq', 201)

    cy.get(importGithub.deployStatusCard).should('be.visible')

    // Real-time polling: first poll running, second poll failed => finish => results.
    cy.wait('@getLogs', POLL_WAIT).its('response.statusCode').should('eq', 200)
    cy.wait('@getLogs', POLL_WAIT).its('response.statusCode').should('eq', 200)
    cy.wait('@getResults', POLL_WAIT).its('response.statusCode').should('eq', 200)
  }

  // The results endpoint answers 200 but with an error envelope. The service throws,
  // so the deploy is marked as failed and never reaches the success card.
  it('surfaces the error and does not reach success when results 200 carries an error message', () => {
    cy.intercept(
      { method: 'GET', pathname: `/api/script-runner/executions/${EXECUTION_ID}/results` },
      { statusCode: 200, body: resultsError }
    ).as('getResults')

    fillSettingsStep()
    deployAndDrivePolling()

    // Error surfaced via toast; flow stays put and success card is not shown.
    cy.contains('Deployment failed').should('exist')
    cy.contains(RESULTS_ERROR_MESSAGE).should('exist')
    cy.get(importGithub.deploySuccessCard).should('not.be.visible')
    cy.get(importGithub.deployStatusCard).should('be.visible')
  })

  // The results endpoint answers 200 with no `errors` AND no provisioned resources.
  // The service treats an empty result as a failed deploy, so it must surface an
  // error and stay on the deploy step instead of optimistically showing success.
  it('shows an error and stays on the step when results 200 has no errors and no provisioned resources', () => {
    cy.intercept(
      { method: 'GET', pathname: `/api/script-runner/executions/${EXECUTION_ID}/results` },
      { statusCode: 200, body: resultsNoErrors }
    ).as('getResults')

    fillSettingsStep()
    deployAndDrivePolling()

    cy.contains('Deployment failed').should('exist')
    cy.contains('Deployment did not provision any resources').should('exist')
    cy.get(importGithub.deploySuccessCard).should('not.be.visible')
    cy.get(importGithub.deployStatusCard).should('be.visible')
  })
})
