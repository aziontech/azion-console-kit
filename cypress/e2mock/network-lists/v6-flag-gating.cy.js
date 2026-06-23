// Fixture-based verification of the Network List v6 route fork (task 12.3 /
// req 10.1 / NFR-B.1): with `use_v6_configurations` ON the edit route loads the
// v6 chunk and the version route works; with it OFF the legacy edit loads and
// the version route redirects to /not-found.
const NETWORK_LIST_ID = 70021
const VERSION_ID = '01JNETLREADY00000000000001'

const editUrl = `/network-lists/edit/${NETWORK_LIST_ID}`
const versionUrl = `/network-lists/edit/${NETWORK_LIST_ID}/versions/${VERSION_ID}`

// Shared landing/editor chrome exposes these stable testids only in v6 chunks.
const v6EditRoot = '[data-testid="network-lists-v6-edit"]'
const v6VersionEditRoot = '[data-testid="network-lists-v6-version-edit"]'
const legacyNameField = '[data-testid="network-list-form__name"]'

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
const stubNetworkListScreen = () => {
  cy.intercept('GET', `**/v4/workspace/network_lists/${NETWORK_LIST_ID}`, {
    fixture: '/network-lists/network-list-detail.json'
  }).as('networkListDetail')

  cy.intercept('GET', `**/v4/workspace/network_lists/${NETWORK_LIST_ID}/versions/${VERSION_ID}`, {
    fixture: '/network-lists/network-list-version-detail.json'
  }).as('networkListVersionDetail')

  cy.intercept('GET', `**/v4/workspace/network_lists/${NETWORK_LIST_ID}/versions*`, {
    fixture: '/network-lists/network-list-versions.json'
  }).as('networkListVersions')
}

describe('Network Lists - v6 flag gating (Mock Test)', { tags: ['@dev3'] }, () => {
  context('Feature flag ON (use_v6_configurations)', () => {
    beforeEach(() => {
      stubAccountWithFlag()
      stubNetworkListScreen()
      cy.login()
    })

    it('loads the v6 edit chunk on the network list edit route', () => {
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
      stubNetworkListScreen()
      cy.login()
    })

    it('loads the legacy edit chunk (never the v6 chunk)', () => {
      cy.visit(editUrl)
      cy.wait('@accountInfo', { timeout: 30000 })

      cy.get(legacyNameField, { timeout: 30000 }).should('exist')
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
