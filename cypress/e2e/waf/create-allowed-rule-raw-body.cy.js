import generateUniqueName from '../../support/utils'
import selectors from '../../support/selectors'

let wafName

describe('WAF spec', { tags: ['@dev7', '@dont_run_prod'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('WAF Rules')

    cy.intercept('/api/v3/waf/rulesets/*').as('saveRuleset')

    wafName = generateUniqueName('WAF')
  })

  it('should create an allowed rule with "raw body" zone', () => {
    // Arrange
    const fixtures = {
      ruleId: '18 - Possible XSS attack: validation with libinjection_xss',
      description: 'Description',
      path: '/',
      matchZone: 'Raw Body',
      status: 'Active'
    }

    // Create WAF
    cy.get(selectors.wafs.createButton).click()
    cy.get(selectors.wafs.nameInput).clear()
    cy.get(selectors.wafs.nameInput).type(wafName)
    cy.get(selectors.form.actionsSubmitButton).click()
    cy.verifyToast('success', 'Your waf rule has been created')
    cy.wait('@saveRuleset')

    // Create Allowed Rule
    cy.get(selectors.wafs.allowedRulesTab).click()
    cy.get(selectors.wafs.allowedRules.createButton).click()

    // Act
    cy.get(selectors.wafs.allowedRules.descriptionField).type(fixtures.description)
    cy.get(selectors.wafs.allowedRules.pathField).type(fixtures.path)
    cy.get(selectors.wafs.allowedRules.ruleIdDropdown).click()
    cy.get(selectors.wafs.allowedRules.ruleIdOption(11)).click()

    cy.get(selectors.wafs.allowedRules.matchZoneDropdown(0)).click()
    cy.get(selectors.wafs.allowedRules.matchZoneOption(0, 6)).click()

    cy.get(selectors.form.actionsSubmitButton).click()

    // Assert
    cy.verifyToast('success', 'Your waf rule allowed has been created')

    cy.get(selectors.list.searchInput).type(`${fixtures.ruleId}{enter}`)
    cy.get(selectors.wafs.seeMore('ruleId')).click()

    cy.get(selectors.wafs.listRow('ruleId')).should('contain.text', fixtures.ruleId)
    cy.get(selectors.wafs.listRow('description')).should('have.text', fixtures.description)
    cy.get(selectors.wafs.listRow('path')).should('have.text', fixtures.path)
    cy.get(selectors.wafs.listRow('matchZones')).should('have.text', fixtures.matchZone)
    cy.get(selectors.wafs.listRow('status')).should('have.text', fixtures.status)
    cy.get(selectors.wafs.listRow('lastModified')).should('not.be.empty')

    cy.get(selectors.wafs.breadcrumbToList).click()
    cy.get(selectors.list.searchInput).type(`${wafName}{enter}`)
  })
})
