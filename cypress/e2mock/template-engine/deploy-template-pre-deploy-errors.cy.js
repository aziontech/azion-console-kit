/* eslint-disable cypress/unsafe-to-chain-command */
import selectors from '../../support/selectors'

// Fixtures
import accountInfo from '../../fixtures/template-engine/account-info.json'
import solutionsList from '../../fixtures/template-engine/solutions-list.json'
import solution from '../../fixtures/template-engine/solution.json'
import template from '../../fixtures/template-engine/template-no-settings.json'
import vcsIntegrations from '../../fixtures/template-engine/vcs-integrations.json'
import templateLoadError from '../../fixtures/template-engine/template-load-error.json'
import githubIntegrationsError from '../../fixtures/template-engine/github-integrations-error.json'
import instantiate400 from '../../fixtures/template-engine/instantiate-400.json'
import instantiate500 from '../../fixtures/template-engine/instantiate-500.json'

const templateEngine = selectors.templateEngine

const VENDOR_SLUG = 'azion'
const SOLUTION_SLUG = 'my-template-e2e'
const TEMPLATE_ID = 'tmpl-e2e-123'
const PROJECT_NAME = 'pre-deploy-error-e2e'

// Mapped service messages (services map status codes to their own messages)
const INTERNAL_ERROR_MESSAGE = 'Something went wrong, please try again.'
const REPO_EXISTS_MESSAGE = 'Repository name already exists'

const openModalAndSelectTemplate = () => {
  cy.get(templateEngine.navbarCreateButton).click()
  cy.get(templateEngine.modalContainer).should('be.visible')
  cy.contains(templateEngine.modalMenuItem, 'Templates').click()
  cy.get(templateEngine.modalTemplatesItem).first().click()
}

const selectGitScope = () => {
  cy.get(templateEngine.gitScopeDropdown).should('be.visible').click()
  cy.contains(templateEngine.dropdownItem, 'azion-e2e-org').click()
  cy.get(templateEngine.gitScopeDropdown).should('contain', 'azion-e2e-org')
}

const assertNoDeploymentOrSuccess = () => {
  cy.get(templateEngine.deployStatusCard).should('not.exist')
  cy.get(templateEngine.deploySuccessCard).should('not.be.visible')
}

describe('Template Engine - Pre-deploy errors (mocked)', { tags: ['@dev3'] }, () => {
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

    // Default (happy) intercepts - individual tests override what they need
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

  it('Scenario 1 - shows an error and no form when the template fails to load', () => {
    cy.intercept(
      { method: 'GET', pathname: `/api/template-engine/templates/${TEMPLATE_ID}` },
      { statusCode: 500, body: templateLoadError }
    ).as('getTemplate')

    openModalAndSelectTemplate()

    cy.wait('@loadSolution')
    cy.wait('@getTemplate').its('response.statusCode').should('eq', 500)

    // Error surfaced and the form is never rendered (stuck on loading state).
    // The toast auto-dismisses, so assert it was rendered (exist), not visibility.
    cy.contains(INTERNAL_ERROR_MESSAGE).should('exist')
    cy.get(templateEngine.inputsCard).should('not.exist')
    cy.get(templateEngine.deployStatusCard).should('not.exist')
    cy.get(templateEngine.deploySuccessCard).should('not.exist')
  })

  it('Scenario 2 - blocks advancing when GitHub integrations fail to load', () => {
    cy.intercept(
      { method: 'GET', url: '**/v4/vcs/integrations*' },
      { statusCode: 500, body: githubIntegrationsError }
    ).as('getVcsIntegrations')

    openModalAndSelectTemplate()
    cy.wait('@loadSolution')
    cy.wait('@getTemplate')
    cy.wait('@getVcsIntegrations').its('response.statusCode').should('eq', 500)

    // Card renders, but with no usable Git Scope the deploy stays blocked
    cy.get(templateEngine.inputsCard).should('be.visible')
    cy.get(templateEngine.projectNameInput).clear().type(PROJECT_NAME)
    cy.get(templateEngine.deployButton).should('be.disabled')

    assertNoDeploymentOrSuccess()
  })

  it('Scenario 3 - blocks advancing when there is no connected GitHub account', () => {
    cy.intercept(
      { method: 'GET', url: '**/v4/vcs/integrations*' },
      { statusCode: 200, body: { results: [] } }
    ).as('getVcsIntegrations')

    openModalAndSelectTemplate()
    cy.wait('@loadSolution')
    cy.wait('@getTemplate')
    cy.wait('@getVcsIntegrations')

    cy.get(templateEngine.inputsCard).should('be.visible')
    cy.get(templateEngine.projectNameInput).clear().type(PROJECT_NAME)
    // No selectable account -> deploy stays disabled
    cy.get(templateEngine.deployButton).should('be.disabled')

    assertNoDeploymentOrSuccess()
  })

  it('Scenario 4 - shows the API message on a 400 instantiate error', () => {
    cy.intercept(
      { method: 'POST', pathname: `/api/template-engine/templates/${TEMPLATE_ID}/instantiate` },
      { statusCode: 400, body: instantiate400 }
    ).as('instantiate')

    openModalAndSelectTemplate()
    cy.wait('@loadSolution')
    cy.wait('@getTemplate')
    cy.wait('@getVcsIntegrations')

    selectGitScope()
    cy.get(templateEngine.projectNameInput).clear().type(PROJECT_NAME)

    cy.get(templateEngine.deployButton).should('not.be.disabled').click()
    cy.wait('@instantiate').its('response.statusCode').should('eq', 400)

    // API business message is surfaced; inputs stay filled; no deploy started
    cy.contains(REPO_EXISTS_MESSAGE).should('exist')
    cy.get(templateEngine.inputsCard).should('be.visible')
    cy.get(templateEngine.projectNameInput).should('have.value', PROJECT_NAME)
    assertNoDeploymentOrSuccess()
  })

  it('Scenario 5 - shows a generic error on a 500 instantiate error and stays recoverable', () => {
    cy.intercept(
      { method: 'POST', pathname: `/api/template-engine/templates/${TEMPLATE_ID}/instantiate` },
      { statusCode: 500, body: instantiate500 }
    ).as('instantiate')

    openModalAndSelectTemplate()
    cy.wait('@loadSolution')
    cy.wait('@getTemplate')
    cy.wait('@getVcsIntegrations')

    selectGitScope()
    cy.get(templateEngine.projectNameInput).clear().type(PROJECT_NAME)

    cy.get(templateEngine.deployButton).should('not.be.disabled').click()
    cy.wait('@instantiate').its('response.statusCode').should('eq', 500)

    // Generic error feedback, inputs preserved, no deploy started
    cy.contains(INTERNAL_ERROR_MESSAGE).should('exist')
    cy.get(templateEngine.inputsCard).should('be.visible')
    cy.get(templateEngine.projectNameInput).should('have.value', PROJECT_NAME)
    assertNoDeploymentOrSuccess()

    // Recoverable: the deploy button is available for another attempt
    cy.get(templateEngine.deployButton).should('not.be.disabled')
  })
})
