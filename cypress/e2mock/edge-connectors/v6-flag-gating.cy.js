// Fixture-based verification of the Connector v6 route fork (task 16.2 /
// req 12.1 / NFR-B.1): with `use_v6_configurations` ON the edit route loads the
// v6 chunk and the version route works; with it OFF the legacy edit loads and
// the version route redirects to /not-found.
const CONNECTOR_ID = 80012
const VERSION_ID = '01JCONNREADY00000000000001'

const editUrl = `/connectors/edit/${CONNECTOR_ID}`
const versionUrl = `/connectors/edit/${CONNECTOR_ID}/versions/${VERSION_ID}`

// Shared landing/editor chrome exposes these stable testids only in v6 chunks.
const v6EditRoot = '[data-testid="edge-connectors-v6-edit"]'
const v6VersionEditRoot = '[data-testid="edge-connectors-v6-version-edit"]'
const legacyNameField =
  '[data-testid="edge-connectors-form__general__name-field__input"]'

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
const stubConnectorScreen = () => {
  cy.intercept('GET', `**/v4/workspace/connectors/${CONNECTOR_ID}`, {
    fixture: '/edge-connectors/connector-detail.json'
  }).as('connectorDetail')

  cy.intercept('GET', `**/v4/workspace/connectors/${CONNECTOR_ID}/versions/${VERSION_ID}`, {
    fixture: '/edge-connectors/connector-version-detail.json'
  }).as('connectorVersionDetail')

  cy.intercept('GET', `**/v4/workspace/connectors/${CONNECTOR_ID}/versions*`, {
    fixture: '/edge-connectors/connector-versions.json'
  }).as('connectorVersions')
}

describe('Edge Connectors - v6 flag gating (Mock Test)', { tags: ['@dev3'] }, () => {
  context('Feature flag ON (use_v6_configurations)', () => {
    beforeEach(() => {
      stubAccountWithFlag()
      stubConnectorScreen()
      cy.login()
    })

    it('loads the v6 edit chunk on the connector edit route', () => {
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
      stubConnectorScreen()
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
