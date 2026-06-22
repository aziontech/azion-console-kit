/* eslint-disable cypress/unsafe-to-chain-command */
import selectors from '../../support/selectors'

// Fixtures
import accountInfo from '../../fixtures/template-engine/account-info.json'
import solutionsList from '../../fixtures/template-engine/solutions-list.json'
import solution from '../../fixtures/template-engine/solution.json'
import template from '../../fixtures/template-engine/template.json'
import vcsIntegrations from '../../fixtures/template-engine/vcs-integrations.json'
import instantiate from '../../fixtures/template-engine/instantiate.json'
import logsColored from '../../fixtures/template-engine/logs-colored.json'

const templateEngine = selectors.templateEngine

// Identifiers shared between fixtures and intercept matchers
const VENDOR_SLUG = 'azion'
const SOLUTION_SLUG = 'my-template-e2e'
const TEMPLATE_ID = 'tmpl-e2e-123'
const EXECUTION_ID = 'exec-e2e-uuid'
const PROJECT_NAME = 'meu-projeto-e2e'
const POLL_INTERVAL_MS = 7000

// Brand color we keep (#E850A8) vs. any other API color we strip.
const BRAND_RGB = 'rgb(232, 80, 168)'
const WRONG_RGB = 'rgb(0, 255, 0)'

describe(
  'Template Engine - Deploy Template log color sanitization (mocked)',
  { tags: ['@dev3'] },
  () => {
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
        { method: 'GET', pathname: '/v4/vcs/integrations' },
        { statusCode: 200, body: vcsIntegrations }
      ).as('getVcsIntegrations')

      cy.loginMock()
      cy.wait('@getAccountInfo')
    })

    it('keeps the #E850A8 brand color and strips every other inline color from logs', () => {
      cy.intercept(
        { method: 'POST', pathname: `/api/template-engine/templates/${TEMPLATE_ID}/instantiate` },
        { statusCode: 201, body: instantiate, delay: 700 }
      ).as('instantiate')

      // Logs polling always returns the colored fixture (status: running) so the
      // deployment step stays on the logs card while we inspect the rendered colors.
      cy.intercept(
        { method: 'GET', pathname: `/api/script-runner/executions/${EXECUTION_ID}/logs` },
        { statusCode: 200, body: logsColored }
      ).as('getLogs')

      // 1. Open the create modal and pick the mocked template
      cy.get(templateEngine.navbarCreateButton).click()
      cy.get(templateEngine.modalContainer).should('be.visible')
      cy.contains(templateEngine.modalMenuItem, 'Templates').click()
      cy.get(templateEngine.modalTemplatesItem).first().click()

      cy.wait('@loadSolution')
      cy.wait('@getTemplate')
      cy.wait('@getVcsIntegrations')

      // 2. Repository step: git scope + project name
      cy.get(templateEngine.gitScopeDropdown).should('be.visible').click()
      cy.contains(templateEngine.dropdownItem, 'azion-e2e-org').click()
      cy.get(templateEngine.projectNameInput).clear()
      cy.get(templateEngine.projectNameInput).type(PROJECT_NAME)

      // 3. Move to the settings step and fill the required key
      cy.get(templateEngine.nextButton).should('not.be.disabled').click()
      cy.get(templateEngine.settingsPasswordInput).type('test-deepgram-key-123')

      // Freeze timers so we drive the logs polling deterministically
      cy.clock(null, ['setTimeout', 'setInterval'])

      // 4. Deploy -> logs card appears
      cy.get(templateEngine.settingsDeployButton).should('not.be.disabled').click()
      cy.wait('@instantiate')
      cy.get(templateEngine.deployStatusCard).should('be.visible')

      // 5. First poll renders the colored logs
      cy.tick(POLL_INTERVAL_MS)
      cy.wait('@getLogs')

      const card = () => cy.get(templateEngine.deployStatusCard)

      // Brand color is preserved (both upper and lower case hex)
      card().contains('span', 'BRAND_COLOR_LINE').should('have.css', 'color', BRAND_RGB)
      card().contains('span', 'BRAND_COLOR_LOWER').should('have.css', 'color', BRAND_RGB)

      // A non-brand color is fully stripped: the only declaration was `color`,
      // so the whole style attribute is removed and the line inherits the theme.
      card()
        .contains('span', 'WRONG_COLOR_LINE')
        .should('not.have.css', 'color', WRONG_RGB)
        .and('not.have.attr', 'style')

      // Single-quoted style attributes are handled the same way
      card()
        .contains('span', 'SINGLE_QUOTE_WRONG')
        .should('not.have.css', 'color', WRONG_RGB)
        .and('not.have.attr', 'style')

      // When other declarations exist, only `color` is dropped; the rest stays
      card()
        .contains('span', 'MIXED_STYLE_LINE')
        .should('not.have.css', 'color', WRONG_RGB)
        .and('have.css', 'font-weight', '700')
        .and('have.attr', 'style')
        .and('not.include', 'color')
    })
  }
)
