/* global cy */
import selectors from '../../support/selectors'

import accountInfo from '../../fixtures/template-engine/account-info.json'
import solution from '../../fixtures/import-github/solution.json'
import vcsProviders from '../../fixtures/import-github/vcs-providers.json'
import vcsIntegrations from '../../fixtures/import-github/vcs-integrations.json'
import repositories from '../../fixtures/import-github/repositories.json'
import presets from '../../fixtures/import-github/presets.json'

export const importGithub = selectors.importGithub

export const VENDOR_SLUG = 'azion'
export const SOLUTION_SLUG = 'my-template-e2e'
export const TEMPLATE_ID = 'tmpl-e2e-123'
export const INTEGRATION_ID = 'vcs-int-1'
export const POLL_INTERVAL_MS = 7000
// Real-time polling: each poll fires every POLL_INTERVAL_MS, so waits must exceed it.
export const POLL_WAIT = { timeout: POLL_INTERVAL_MS + 5000 }

/**
 * Intercepts every backend call the import-from-github settings step makes on load.
 * Individual specs override a route by re-intercepting with the same matcher after
 * calling this (the last matching intercept wins).
 */
export const setupBaseIntercepts = () => {
  cy.intercept(
    { method: 'GET', url: '**/api/account/info' },
    { statusCode: 200, body: accountInfo }
  ).as('getAccountInfo')

  cy.intercept(
    { method: 'GET', pathname: `/api/marketplace/solution/${VENDOR_SLUG}/${SOLUTION_SLUG}` },
    { statusCode: 200, body: solution }
  ).as('loadSolution')

  cy.intercept(
    { method: 'GET', pathname: '/v4/vcs/providers' },
    { statusCode: 200, body: vcsProviders }
  ).as('listPlatforms')

  cy.intercept(
    { method: 'GET', pathname: '/v4/vcs/integrations' },
    { statusCode: 200, body: vcsIntegrations }
  ).as('listIntegrations')

  cy.intercept(
    { method: 'GET', url: `**/v4/vcs/integrations/${INTEGRATION_ID}/repositories*` },
    { statusCode: 200, body: repositories }
  ).as('listRepositories')

  cy.intercept(
    { method: 'GET', url: '**/v4/utils/presets*' },
    { statusCode: 200, body: presets }
  ).as('listPresets')

  // Framework auto-detection hits the GitHub API directly. Stub it so no real
  // request leaks; the framework is selected manually in the form afterwards.
  cy.intercept(
    { method: 'GET', url: 'https://api.github.com/**' },
    { statusCode: 404, body: {} }
  ).as('detectFramework')
}

/** Logs in (mocked) and lands on the import-from-github settings step. */
export const visitImportGithub = () => {
  cy.loginMock()
  cy.visit(`/github/${VENDOR_SLUG}/${SOLUTION_SLUG}`)
}

/**
 * Fills the settings form with a valid integration, repository, framework and
 * application name. Stops right before the Deploy click.
 */
export const fillSettingsStep = () => {
  cy.wait('@loadSolution')
  cy.wait('@listIntegrations')
  // Presets are the last onMounted load before the form's resetForm() runs.
  // Waiting here guarantees our selections aren't wiped by that reset.
  cy.wait('@listPresets')

  // Git Scope
  cy.get(importGithub.gitScopeDropdown).click()
  cy.get(importGithub.dropdownItem).contains('azion-e2e-org').click()
  cy.wait('@listRepositories')

  // Repository (triggers framework auto-detect + suggested app name)
  cy.get(importGithub.repositoryDropdown).click()
  cy.get(importGithub.dropdownItem).contains('my-repo').click()

  // Framework (selected manually - auto-detect is stubbed out)
  cy.get(importGithub.frameworkDropdown).click()
  cy.get(importGithub.dropdownItem).contains('Next.js').click()

  // Application name - typed explicitly so validation can't fail on auto-fill timing.
  cy.get(importGithub.applicationNameInput).clear()
  cy.get(importGithub.applicationNameInput).type('my-app-e2e')
}
