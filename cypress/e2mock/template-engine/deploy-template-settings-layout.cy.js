/* eslint-disable cypress/unsafe-to-chain-command */
import selectors from '../../support/selectors'

// Fixtures
import accountInfo from '../../fixtures/template-engine/account-info.json'
import solutionsList from '../../fixtures/template-engine/solutions-list.json'
import solution from '../../fixtures/template-engine/solution.json'
import vcsIntegrations from '../../fixtures/template-engine/vcs-integrations.json'
import jsonFormTemplate from '../../fixtures/template-engine/template-multiple-settings.json'
import azionTemplate from '../../fixtures/template-engine/template-azion-multiple-settings.json'

const templateEngine = selectors.templateEngine

const VENDOR_SLUG = 'azion'
const SOLUTION_SLUG = 'my-template-e2e'
const TEMPLATE_ID = 'tmpl-e2e-123'
const VALID_NAME = 'valid-project-name'
// Tolerance (px) to absorb sub-pixel rounding when comparing element positions
const ALIGN_TOLERANCE = 6

/**
 * Common intercepts shared by both engines. The template definition is set per
 * test because each engine uses a differently shaped input_schema.
 */
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

const openTemplateCard = () => {
  cy.get(templateEngine.navbarCreateButton).click()
  cy.get(templateEngine.modalContainer).should('be.visible')
  cy.contains(templateEngine.modalMenuItem, 'Templates').click()
  cy.get(templateEngine.modalTemplatesItem).first().click()

  cy.wait('@loadSolution')
  cy.wait('@getTemplate')
  cy.wait('@getVcsIntegrations')
}

/**
 * Reads the bounding rect of three elements and asserts they are laid out 2 per
 * row: the first two share a row (same top, first to the left of the second) and
 * the third wraps to a new row aligned with the first column.
 */
const assertTwoPerRow = (firstSelector, secondSelector, thirdSelector) => {
  cy.get(firstSelector).then(($first) => {
    const first = $first[0].getBoundingClientRect()
    cy.get(secondSelector).then(($second) => {
      const second = $second[0].getBoundingClientRect()
      cy.get(thirdSelector).then(($third) => {
        const third = $third[0].getBoundingClientRect()

        // Row 1: first and second on the same line, side by side
        expect(Math.abs(first.top - second.top), 'first and second share a row').to.be.lessThan(
          ALIGN_TOLERANCE
        )
        expect(first.left, 'first is left of second').to.be.lessThan(second.left)

        // Row 2: third wraps below, aligned to the first column
        expect(third.top, 'third wraps to a new row').to.be.greaterThan(first.top + ALIGN_TOLERANCE)
        expect(
          Math.abs(third.left - first.left),
          'third aligns with the first column'
        ).to.be.lessThan(ALIGN_TOLERANCE)
      })
    })
  })
}

describe('Template Engine - Settings 2-per-row layout (mocked)', { tags: ['@dev3'] }, () => {
  beforeEach(() => {
    // A wide viewport guarantees the >=640px breakpoint (2 columns)
    cy.viewport(1280, 800)
    setupCommonIntercepts()
    cy.loginMock()
    cy.wait('@getAccountInfo')
  })

  it('JSON Forms engine: renders 3 settings fields 2 per row', () => {
    cy.intercept(
      { method: 'GET', pathname: `/api/template-engine/templates/${TEMPLATE_ID}` },
      { statusCode: 200, body: jsonFormTemplate }
    ).as('getTemplate')

    openTemplateCard()

    // Repository step: select Git Scope and fill a valid application name
    cy.get(templateEngine.gitScopeDropdown).should('be.visible').click()
    cy.contains(templateEngine.dropdownItem, 'azion-e2e-org').click()
    cy.get(templateEngine.projectNameInput).clear().type(VALID_NAME)

    // Advance to the settings step
    cy.get(templateEngine.nextButton).should('not.be.disabled').click()
    cy.get(templateEngine.settingsCard).should('be.visible')

    // All three settings fields are visible
    cy.get(templateEngine.settingsEnvironmentField).should('be.visible')
    cy.get(templateEngine.settingsRegionField).should('be.visible')
    cy.get(templateEngine.settingsTierField).should('be.visible')

    // Layout: environment + region share row 1, tier wraps to row 2
    assertTwoPerRow(
      templateEngine.settingsEnvironmentField,
      templateEngine.settingsRegionField,
      templateEngine.settingsTierField
    )
  })

  it('Azion engine: renders 3 settings fields 2 per row', () => {
    cy.intercept(
      { method: 'GET', pathname: `/api/template-engine/templates/${TEMPLATE_ID}` },
      { statusCode: 200, body: azionTemplate }
    ).as('getTemplate')

    openTemplateCard()

    // Repository step: select Git Scope (FieldDropdown) and fill a valid name
    cy.get(templateEngine.azionGitScopeDropdown).should('be.visible').click()
    cy.contains(templateEngine.dropdownItem, 'azion-e2e-org').click()
    cy.get(templateEngine.azionAppNameInput).clear().type(VALID_NAME)

    // Advance to the settings step
    cy.get(templateEngine.nextButton).should('not.be.disabled').click()
    cy.get(templateEngine.settingsCard).should('be.visible')

    // All three settings fields are visible
    cy.get(templateEngine.azionSettingOneInput).should('be.visible')
    cy.get(templateEngine.azionSettingTwoInput).should('be.visible')
    cy.get(templateEngine.azionSettingThreeInput).should('be.visible')

    // Layout: setting_one + setting_two share row 1, setting_three wraps to row 2
    assertTwoPerRow(
      templateEngine.azionSettingOneInput,
      templateEngine.azionSettingTwoInput,
      templateEngine.azionSettingThreeInput
    )
  })
})
