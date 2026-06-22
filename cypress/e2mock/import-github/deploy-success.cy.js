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
import logsSucceeded from '../../fixtures/template-engine/logs-succeeded.json'
import results from '../../fixtures/template-engine/results.json'

const EXECUTION_ID = 'exec-import-github-success'
const MOCKED_DOMAIN = results.result.domain.url

describe('Import from GitHub - Deploy success flow (mocked)', { tags: ['@dev3'] }, () => {
  let logsCall

  beforeEach(() => {
    logsCall = 0
    setupBaseIntercepts()

    cy.intercept(
      { method: 'POST', pathname: `/api/template-engine/templates/${TEMPLATE_ID}/instantiate` },
      { statusCode: 201, body: { uuid: EXECUTION_ID } }
    ).as('instantiate')

    // Logs polling: first poll running, second poll succeeded.
    cy.intercept(
      { method: 'GET', pathname: `/api/script-runner/executions/${EXECUTION_ID}/logs` },
      (req) => {
        logsCall += 1
        req.reply(logsCall >= 2 ? logsSucceeded : logsRunning)
      }
    ).as('getLogs')

    cy.intercept(
      { method: 'GET', pathname: `/api/script-runner/executions/${EXECUTION_ID}/results` },
      { statusCode: 200, body: results }
    ).as('getResults')

    // Trailing calls made by the success card (kept benign to avoid real requests).
    cy.intercept(
      { method: 'GET', pathname: '/v4/workspace/dns/zones' },
      { statusCode: 200, body: { count: 0, results: [] } }
    ).as('listDnsZones')

    cy.intercept(
      { method: 'GET', url: '**/v4/workspace/workloads/*' },
      { statusCode: 200, body: {} }
    ).as('loadWorkload')

    visitImportGithub()
  })

  it('deploys end to end and shows the success card with the app URL and resources', () => {
    fillSettingsStep()

    cy.get(importGithub.deployButton).should('not.be.disabled').click()
    cy.wait('@instantiate').its('response.statusCode').should('eq', 201)

    // Logs card appears
    cy.get(importGithub.deployStatusCard).should('be.visible')

    // First poll => running logs
    cy.wait('@getLogs', POLL_WAIT)
    cy.get(importGithub.deployStatusCard).should('contain', 'Cloning repository')

    // Second poll => succeeded => finish => fetch results => success step
    cy.wait('@getLogs', POLL_WAIT)
    cy.wait('@getResults', POLL_WAIT).its('response.statusCode').should('eq', 200)

    // Success card visible, settings form gone
    cy.get(importGithub.deploySuccessCard).should('be.visible')

    // App URL points at the real edge domain from the results payload
    cy.get(importGithub.deploySuccessUrl)
      .should('have.attr', 'target', '_blank')
      .and('have.attr', 'href')
      .and('include', MOCKED_DOMAIN)

    // Resource links (Edge Application / Workload) open in a new tab
    cy.get(importGithub.deploySuccessResourceLink)
      .should('have.length.at.least', 1)
      .each(($a) => {
        cy.wrap($a)
          .should('have.attr', 'target', '_blank')
          .and('have.attr', 'rel')
          .and('include', 'noopener')
        cy.wrap($a).invoke('attr', 'href').should('not.be.empty')
      })
  })
})
