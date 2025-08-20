import selectors from '../../support/selectors'

describe('Waf Rules Tuning', { tags: ['@dev4'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.intercept('GET', '/v4/workspace/wafs*', {
      fixture: '/waf-rules/waf-list.json'
    }).as('wafListApi')

    cy.openProduct('WAF Rules')

    cy.wait('@wafListApi', { timeout: 30000 })
    cy.intercept('GET', '/v4/workspace/wafs/6648', {
      fixture: '/waf-rules/waf-main-settings.json'
    }).as('wafMainSettings')
    cy.get(selectors.list.filteredRow.column('name')).first().click()
    cy.wait('@wafMainSettings', { timeout: 30000 })
  })

  it('should allow to create correct rule with ruleId 11 in more details', () => {
    cy.intercept('GET', '/api/v3/waf/*/domains?page_size=200', {
      fixture: '/waf-rules/tuning/available-domains.json'
    }).as('wafDomains')
    cy.get(selectors.wafTuning.tabs('tuning')).click()
    cy.wait('@wafDomains', { timeout: 30000 })
    cy.intercept('GET', '/api/v3/waf/*/waf_events*', {
      fixture: '/waf-rules/tuning/tuning-list.json'
    }).as('wafTuning')
    cy.get(selectors.wafTuning.domainsField).click()
    cy.get(selectors.wafTuning.domainItem).first().click()
    cy.wait('@wafTuning', { timeout: 30000 })
    cy.get(selectors.wafTuning.closeDomainsSelector).click()
    cy.intercept('GET', '/api/v3/waf/*/waf_events/11*', {
      fixture: '/waf-rules/tuning/details.json'
    }).as('wafTuningDetails')
    cy.get(selectors.list.filteredRow.column('ruleIdDescription')).click()
    cy.wait('@wafTuningDetails', { timeout: 30000 })
    cy.get(selectors.wafTuning.dataTableRowCheckbox).eq(1).click()
    cy.get(selectors.wafTuning.submitButton).eq(1).click()
    cy.get('textarea').type('teste')
    cy.intercept('POST', '/v4/workspace/wafs/6648/exceptions', (req) => {
      expect(req.body).to.have.property('match_zones')
      expect(req.body.match_zones).to.be.an('array')
      expect(req.body.match_zones).to.deep.include({
        zone: 'request_body',
        matches_on: 'value',
        zone_input: null
      })

      req.reply({
        statusCode: 202,
        body: {}
      })
    }).as('allowRules')
    cy.get(selectors.wafTuning.allowRulesButton).click()
    cy.wait('@allowRules', { timeout: 30000 })
  })

  it('should allow to create correct rule with ruleId 11 without path', () => {
    cy.intercept('GET', '/api/v3/waf/*/domains?page_size=200', {
      fixture: '/waf-rules/tuning/available-domains.json'
    }).as('wafDomains')
    cy.get(selectors.wafTuning.tabs('tuning')).click()
    cy.wait('@wafDomains', { timeout: 30000 })
    cy.intercept('GET', '/api/v3/waf/*/waf_events*', {
      fixture: '/waf-rules/tuning/tuning-list.json'
    }).as('wafTuning')
    cy.get(selectors.wafTuning.domainsField).click()
    cy.get(selectors.wafTuning.domainItem).first().click()
    cy.wait('@wafTuning', { timeout: 30000 })
    cy.get(selectors.wafTuning.closeDomainsSelector).click()
    cy.intercept('GET', '/api/v3/waf/*/waf_events/11*', {
      fixture: '/waf-rules/tuning/details.json'
    }).as('wafTuningDetails')
    cy.get(selectors.wafTuning.dataTableRowCheckbox).click()
    cy.get(selectors.wafTuning.submitButton).click()
    cy.get('textarea').type('teste')
    cy.intercept('POST', '/v4/workspace/wafs/6648/exceptions', (req) => {
      expect(req.body).to.have.property('match_zones')
      expect(req.body.match_zones).to.be.an('array')
      expect(req.body.match_zones).to.deep.include({
        zone: 'request_body',
        matches_on: 'value'
      })

      req.reply({
        statusCode: 202,
        body: {}
      })
    }).as('allowRules')
    cy.get(selectors.wafTuning.allowRulesButton).click()
    cy.wait('@allowRules', { timeout: 30000 })
  })
})
