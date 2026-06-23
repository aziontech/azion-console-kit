// Fixture-based verification of the WAF v6 route fork (task 12.3 /
// req 10.1 / NFR-B.1): with `use_v6_configurations` ON the edit route loads the
// v6 chunk and the version route works; with it OFF the legacy edit loads and
// the version route redirects to /not-found.
const WAF_ID = 60033
const VERSION_ID = '01JWAFREADY000000000000001'

const editUrl = `/waf/edit/${WAF_ID}`
const versionUrl = `/waf/edit/${WAF_ID}/versions/${VERSION_ID}`

// Shared landing/editor chrome exposes these stable testids only in v6 chunks.
const v6EditRoot = '[data-testid="waf-v6-edit"]'
const v6VersionEditRoot = '[data-testid="waf-v6-version-edit"]'
// Legacy WAF edit renders the tabbed TabsView (Main Settings / Tuning / Allowed).
const legacyMainSettingsTab = '[data-testid="waf-rules-tabs__tab__main-settings"]'

const stubAccountWithFlag = () => {
  cy.intercept('GET', '/api/account/info', {
    fixture: '/account/info/v6_configurations_flag.json'
  }).as('accountInfo')
}

const stubAccountWithoutFlag = () => {
  cy.intercept('GET', '/api/account/info', {
    fixture: '/account/info/without_v6_configurations_flag.json'
  }).as('accountInfo')
}

// Requests fired by the v6 landing/version screens on mount.
const stubWafScreen = () => {
  cy.intercept('GET', `**/v4/workspace/wafs/${WAF_ID}`, {
    fixture: '/waf-rules/waf-detail.json'
  }).as('wafDetail')

  cy.intercept('GET', `**/v4/workspace/wafs/${WAF_ID}/versions/${VERSION_ID}`, {
    fixture: '/waf-rules/waf-version-detail.json'
  }).as('wafVersionDetail')

  cy.intercept('GET', `**/v4/workspace/wafs/${WAF_ID}/versions*`, {
    fixture: '/waf-rules/waf-versions.json'
  }).as('wafVersions')
}

describe('WAF Rules - v6 flag gating (Mock Test)', { tags: ['@dev3'] }, () => {
  context('Feature flag ON (use_v6_configurations)', () => {
    beforeEach(() => {
      stubAccountWithFlag()
      stubWafScreen()
      cy.login()
    })

    it('loads the v6 edit chunk on the WAF edit route', () => {
      cy.visit(editUrl)
      cy.wait('@accountInfo', { timeout: 30000 })

      cy.get(v6EditRoot, { timeout: 30000 }).should('exist')
      cy.location('pathname').should('eq', editUrl)
    })

    it('serves the version route (no redirect) with the flag on', () => {
      cy.visit(versionUrl)
      cy.wait('@accountInfo', { timeout: 30000 })

      cy.get(v6VersionEditRoot, { timeout: 30000 }).should('exist')
      cy.location('pathname').should('eq', versionUrl)
    })
  })

  context('Feature flag OFF', () => {
    beforeEach(() => {
      stubAccountWithoutFlag()
      stubWafScreen()
      cy.login()
    })

    it('loads the legacy edit chunk (never the v6 chunk)', () => {
      cy.visit(editUrl)
      cy.wait('@accountInfo', { timeout: 30000 })

      cy.get(legacyMainSettingsTab, { timeout: 30000 }).should('exist')
      cy.get(v6EditRoot).should('not.exist')
      cy.location('pathname').should('eq', editUrl)
    })

    it('redirects the version route to /not-found (fail-closed flagGuard)', () => {
      cy.visit(versionUrl)
      cy.wait('@accountInfo', { timeout: 30000 })

      cy.location('pathname', { timeout: 30000 }).should('eq', '/not-found')
      cy.get(v6VersionEditRoot).should('not.exist')
    })
  })
})
