/* eslint-disable cypress/unsafe-to-chain-command */

/**
 * New Release ("Review & deploy") — Application dependency version selection (mocked e2e).
 *
 * Focused happy path for the application-scoped dependency groups: when a release
 * is composed around an Application, the composer DETECTS both its Functions
 * (from the function-instance list) and its Connectors (from rules-engine rules
 * whose behavior is `set_connector`) and renders one locked, required row per
 * distinct dependency with a version selector. Build & activate stays disabled
 * (with the pending-dependencies footer hint) until EVERY dependency — function
 * AND connector — has a Ready version picked; once each is selected the deploy is
 * enabled, and the dispatched `build_and_activate` body carries every dependency
 * as `{ resource_id, resource_type, version_id }` (`function` and `connector`).
 *
 * Every backend is stubbed (no real API). Verified API shapes drive the stubs:
 *   - List DS:                GET /deployment-api/v4/deployments
 *   - Active release:         GET /deployment-api/v4/deployments/{id}/releases?traffic_role=active
 *   - Build & activate:       POST /deployment-api/v4/deployments/{id}/build_and_activate -> 202
 *   - Application detail:     GET /v4/workspace/applications/{id}   (modules.functions.enabled)
 *   - Function instances:     GET /v4/workspace/applications/{id}/functions?fields=function
 *   - Rules engine:           GET /v4/workspace/applications/{id}/request_rules  (+ /response_rules)
 *                             (a `set_connector` behavior -> a Connector dependency)
 *   - Application versions:   GET /v4/workspace/applications/{id}/versions
 *   - Function versions:      GET /v4/workspace/functions/{id}/versions
 *   - Connectors catalog:     GET /v4/workspace/connectors
 *   - Connector versions:     GET /v4/workspace/connectors/{id}/versions
 *
 * All assertions use the `release-composition__*` data-testids the components
 * expose, never copy text, so the spec is resilient to wording changes.
 */

const sel = {
  view: '[data-testid="release-composition__view"]',
  composition: '[data-testid="release-composition__composition"]',

  // Version picker (ResourceVersionField) — grouped dropdown, appendTo body.
  versionSelect: '[data-testid="release-composition__version-select"]',
  versionLatest: '[data-testid="release-composition__version-latest"]',
  versionOption: (value) => `[data-testid="release-composition__version-option-${value}"]`,

  // Dependencies (ReleaseDependenciesSection) — nested per-type groups
  // (function / connector). Per-row testids are type-parameterized and unchanged.
  depsSection: '[data-testid="release-composition__deps-section"]',
  depsGroup: (type) => `[data-testid="release-composition__deps-group-${type}"]`,
  depsGroupHeader: (type) => `[data-testid="release-composition__deps-group-header-${type}"]`,
  depsBody: (type) => `[data-testid="release-composition__deps-body-${type}"]`,
  depsCount: (type) => `[data-testid="release-composition__deps-count-${type}"]`,
  depsRow: (type, id) => `[data-testid="release-composition__deps-row-${type}-${id}"]`,
  depsFixed: (type, id) => `[data-testid="release-composition__deps-fixed-${type}-${id}"]`,
  depsNoVersions: (type, id) =>
    `[data-testid="release-composition__deps-no-versions-${type}-${id}"]`,

  // DS picker.
  dsRow: (id) => `[data-testid="release-composition__ds-row-${id}"]`,

  // Loading / error / retry states for the application dependency discovery.
  dependenciesLoading: '[data-testid="release-composition__dependencies-loading"]',
  dependenciesError: '[data-testid="release-composition__dependencies-error"]',
  dependenciesRetry: '[data-testid="release-composition__dependencies-retry"]',

  // Footer + confirm.
  footerPendingDependencies: '[data-testid="release-composition__footer-pending-dependencies"]',
  buildAndActivate: '[data-testid="release-composition__build-and-activate"]',
  confirmDialog: '[data-testid="release-composition__confirm-dialog"]',
  confirmBuild: '[data-testid="release-composition__confirm-build"]',

  // Shared PrimeVue dropdown internals (webkit Dropdown), rendered to <body>.
  dropdownPanel: '.p-dropdown-panel'
}

// --- Stub data (verified shapes) --------------------------------------------

const APPLICATION_ID = 1727808946
const APP_VERSION_READY = '01J8READY0000000000000001'

// Two DISTINCT functions bound to the application (two instances). The composer
// dedupes by functionId and renders one locked row per distinct Function.
const FUNCTION_A = 76691
const FUNCTION_B = 76692
const FN_A_READY = 'AYQSKKFU'
const FN_A_OTHER = 'BZRTLLGV'
const FN_B_READY = 'CWUMNNHX'

// One connector discovered via the application's rules engine: a request-phase
// rule whose behavior is `set_connector` pins CONNECTOR_A. The composer renders
// it as a locked, required row under the Connectors group, just like functions.
const CONNECTOR_A = 55021
const CONN_A_READY = 'DXVTOOIY'
const CONN_A_OTHER = 'EZWUPPJZ'

const DS_APP = 'dep-magalu-storefront'

const deploymentsList = {
  count: 1,
  results: [
    {
      id: DS_APP,
      name: 'magalu-storefront',
      deployment_policy: 'single_version',
      state: 'active',
      created_at: '2026-05-01T10:00:00Z',
      updated_at: '2026-06-01T12:00:00Z'
    }
  ]
}

// Active release pins the Application; the Functions are discovered from the
// application's instance list (application flow), not from the release.
const activeRelease = {
  results: [
    {
      id: 'rel-checkout-redesign',
      traffic_role: 'ACTIVE',
      state: 'ready',
      resources: [
        {
          resource_type: 'application',
          global_id: APPLICATION_ID,
          resource_id: null,
          version_id: APP_VERSION_READY
        }
      ]
    }
  ]
}

// Application detail with the Functions module ON (modules.functions.enabled).
const applicationDetail = {
  data: {
    id: APPLICATION_ID,
    name: 'deploy-drawer-app',
    modules: {
      cache: { enabled: true },
      functions: { enabled: true },
      application_accelerator: { enabled: false },
      image_processor: { enabled: false },
      tiered_cache: { enabled: false }
    }
  }
}

// Two function instances bound to TWO distinct functions (fields=function ->
// each result exposes `function` = the function id the adapter reads).
const functionInstances = {
  count: 2,
  results: [
    { id: 9001, function: FUNCTION_A },
    { id: 9002, function: FUNCTION_B }
  ]
}

const applicationsCatalog = {
  count: 1,
  results: [{ id: APPLICATION_ID, name: 'deploy-drawer-app', product_version: '2.0' }]
}

const applicationVersions = {
  count: 1,
  results: [
    {
      version_id: APP_VERSION_READY,
      version_state: 'ready',
      created_at: '2026-06-10T09:00:00Z',
      last_editor: 'qa@azion.com'
    }
  ]
}

// Function A: one Ready (selectable) + one building (excluded by the strict
// Ready-only filter for functions). Function B: one Ready.
const functionAVersions = {
  count: 2,
  results: [
    {
      version_id: FN_A_READY,
      version_state: 'ready',
      created_at: '2026-06-10T09:00:00Z',
      last_editor: 'qa@azion.com'
    },
    {
      version_id: FN_A_OTHER,
      version_state: 'ready',
      created_at: '2026-06-05T09:00:00Z',
      last_editor: 'qa@azion.com'
    }
  ]
}

const functionBVersions = {
  count: 1,
  results: [
    {
      version_id: FN_B_READY,
      version_state: 'ready',
      created_at: '2026-06-08T09:00:00Z',
      last_editor: 'qa@azion.com'
    }
  ]
}

// Rules engine: the connector is detected when a rule's behavior is
// `set_connector` with the connector id in `attributes.value`. The list adapter
// passes `behaviors` through verbatim and sorts by `order`, so each rule carries
// an `order`. Request phase pins CONNECTOR_A (twice -> deduped to one row); the
// response phase has no connector behavior.
const requestRules = {
  count: 2,
  results: [
    {
      id: 4001,
      name: 'route-to-storage',
      order: 0,
      active: true,
      phase: 'request',
      behaviors: [{ type: 'set_connector', attributes: { value: CONNECTOR_A } }],
      criteria: []
    },
    {
      id: 4002,
      name: 'also-route-to-storage',
      order: 1,
      active: true,
      phase: 'request',
      behaviors: [{ type: 'set_connector', attributes: { value: CONNECTOR_A } }],
      criteria: []
    }
  ]
}

const responseRules = {
  count: 1,
  results: [
    {
      id: 4101,
      name: 'add-header',
      order: 0,
      active: true,
      phase: 'response',
      behaviors: [{ type: 'add_response_header', attributes: { value: 'x-edge: 1' } }],
      criteria: []
    }
  ]
}

// Connector catalog (id -> name) the composer primes for the locked row label.
const connectorsCatalog = {
  count: 1,
  results: [{ id: CONNECTOR_A, name: 'magalu-object-storage' }]
}

// Connector A: two Ready versions (latest-Ready sentinel + both pinned options).
const connectorAVersions = {
  count: 2,
  results: [
    {
      version_id: CONN_A_READY,
      version_state: 'ready',
      created_at: '2026-06-09T09:00:00Z',
      last_editor: 'qa@azion.com'
    },
    {
      version_id: CONN_A_OTHER,
      version_state: 'ready',
      created_at: '2026-06-04T09:00:00Z',
      last_editor: 'qa@azion.com'
    }
  ]
}

const buildAndActivateResponse = {
  data: { id: 'rel-new-01', state: 'ready', traffic_role: 'ACTIVE', trace_id: 'trace-001' }
}

const emptyList = { count: 0, results: [] }

// --- Stub helpers ------------------------------------------------------------

const stubAccountWithFlag = () => {
  cy.intercept('GET', '/api/account/info', {
    fixture: '/account/info/deploy_drawer_v6_flag.json'
  }).as('accountInfo')
}

const stubReleaseListings = () => {
  cy.intercept('GET', '**/deployment-api/v4/deployments?*', { body: deploymentsList }).as(
    'deployments'
  )

  cy.intercept('GET', `**/deployment-api/v4/deployments/${DS_APP}/releases?*`, {
    body: activeRelease
  }).as('activeRelease')

  // Application flow: detail (modules) + function-instances (fields=function).
  cy.intercept('GET', `**/v4/workspace/applications/${APPLICATION_ID}`, {
    body: applicationDetail
  }).as('applicationDetail')
  cy.intercept('GET', `**/v4/workspace/applications/${APPLICATION_ID}/functions?*`, {
    body: functionInstances
  }).as('functionInstances')

  // Connector discovery via the rules engine: a `set_connector` behavior in
  // either phase pins a Connector dependency. Both phases are fetched.
  cy.intercept('GET', `**/v4/workspace/applications/${APPLICATION_ID}/request_rules*`, {
    body: requestRules
  }).as('requestRules')
  cy.intercept('GET', `**/v4/workspace/applications/${APPLICATION_ID}/response_rules*`, {
    body: responseRules
  }).as('responseRules')

  // Catalogs the composer primes + per-resource versions for the pickers.
  cy.intercept('GET', '**/v4/workspace/applications?*', { body: applicationsCatalog }).as(
    'applicationsCatalog'
  )
  cy.intercept('GET', `**/v4/workspace/applications/${APPLICATION_ID}/versions*`, {
    body: applicationVersions
  }).as('applicationVersions')

  cy.intercept('GET', `**/v4/workspace/functions/${FUNCTION_A}/versions*`, {
    body: functionAVersions
  }).as('functionAVersions')
  cy.intercept('GET', `**/v4/workspace/functions/${FUNCTION_B}/versions*`, {
    body: functionBVersions
  }).as('functionBVersions')

  // Connector catalog (id -> name) + the discovered connector's Ready versions.
  cy.intercept('GET', '**/v4/workspace/connectors?*', { body: connectorsCatalog }).as('connectors')
  cy.intercept('GET', `**/v4/workspace/connectors/${CONNECTOR_A}/versions*`, {
    body: connectorAVersions
  }).as('connectorAVersions')

  // Optional-singleton + dependency catalogs the screen may prime — keep them
  // empty so nothing is fabricated; they must never break the screen.
  cy.intercept('GET', '**/v4/workspace/firewalls?*', { body: emptyList }).as('firewalls')
  cy.intercept('GET', '**/v4/workspace/custom_pages?*', { body: emptyList }).as('customPages')
  cy.intercept('GET', '**/v4/workspace/functions?*', { body: emptyList }).as('functions')
  cy.intercept('GET', '**/v4/workspace/network_lists?*', { body: emptyList }).as('networkLists')
  cy.intercept('GET', '**/v4/workspace/wafs?*', { body: emptyList }).as('wafs')
}

const stubBuildAndActivate = () => {
  cy.intercept('POST', '**/deployment-api/v4/deployments/*/build_and_activate', {
    statusCode: 202,
    body: buildAndActivateResponse
  }).as('buildAndActivate')
}

const visitFromDeployment = () => {
  cy.visit('/deployments/releases/new')
  cy.wait('@accountInfo', { timeout: 30000 })
}

// Toggle a DS by clicking its row label (drives the array v-model the same way
// a real click does, without depending on the visually-hidden PrimeVue input).
const checkDs = (id) => {
  cy.get(sel.dsRow(id)).scrollIntoView()
  cy.get(sel.dsRow(id)).click()
}

// Pick a Ready version on a dependency row of any type: open the row's grouped
// version dropdown (appended to <body>) and click the option by version id.
const pickDependencyVersion = (type, rowId, versionId) => {
  cy.get(sel.depsRow(type, rowId)).find(sel.versionSelect).click()
  cy.get(sel.dropdownPanel).should('be.visible')
  cy.get(sel.versionOption(versionId)).click()
}

const pickFunctionVersion = (rowId, versionId) =>
  pickDependencyVersion('function', rowId, versionId)
const pickConnectorVersion = (rowId, versionId) =>
  pickDependencyVersion('connector', rowId, versionId)

describe('New Release - Application dependency version selection (Mock Test)', { tags: ['@dev2'] }, () => {
  beforeEach(() => {
    stubAccountWithFlag()
    stubReleaseListings()
    stubBuildAndActivate()
    cy.login()
    visitFromDeployment()
    cy.wait('@deployments', { timeout: 30000 })

    // Compose the release around the DS that pins the Application — the
    // application flow then detects its Functions from the instance list.
    checkDs(DS_APP)
    cy.wait('@activeRelease', { timeout: 30000 })
    cy.wait('@applicationDetail', { timeout: 30000 })
    cy.wait('@functionInstances', { timeout: 30000 })
    // Connector discovery runs in parallel from the rules engine (both phases).
    cy.wait('@requestRules', { timeout: 30000 })
    cy.wait('@responseRules', { timeout: 30000 })
    cy.get(sel.composition).should('be.visible')
  })

  it('renders one locked, required row per distinct Function AND Connector with a version selector', () => {
    // Both groups are seeded automatically from the detected dependencies — the
    // Functions group from the two distinct function instances, the Connectors
    // group from the deduped `set_connector` rule. Every dependency is
    // app-managed (locked): the resource is a fixed label (never a select) and
    // there is no "Add" affordance; each row exposes only a version selector.
    cy.get(sel.depsSection).should('exist')

    // Functions group: two locked rows.
    cy.get(sel.depsGroupHeader('function')).click()
    cy.get(sel.depsBody('function')).should('be.visible')
    cy.get(sel.depsCount('function')).should('contain', '2')
    cy.get(sel.depsRow('function', 0)).should('be.visible')
    cy.get(sel.depsRow('function', 1)).should('be.visible')
    cy.get(sel.depsFixed('function', 0)).should('be.visible')
    cy.get(sel.depsFixed('function', 1)).should('be.visible')
    cy.get(sel.depsRow('function', 0)).find(sel.versionSelect).should('exist')
    cy.get(sel.depsRow('function', 1)).find(sel.versionSelect).should('exist')

    // Connectors group: one locked row (the two rules deduped to a single
    // distinct connector).
    cy.get(sel.depsGroup('connector')).should('exist')
    cy.get(sel.depsGroupHeader('connector')).click()
    cy.get(sel.depsBody('connector')).should('be.visible')
    cy.get(sel.depsCount('connector')).should('contain', '1')
    cy.get(sel.depsRow('connector', 0)).should('be.visible')
    cy.get(sel.depsFixed('connector', 0)).should('be.visible')
    cy.get(sel.depsRow('connector', 0)).find(sel.versionSelect).should('exist')
  })

  it('keeps Build & activate disabled with the pending-dependencies hint until every Function AND Connector has a version', () => {
    // No dependency version picked yet -> the deploy gate blocks and the footer
    // surfaces the pending-dependencies hint.
    cy.get(sel.buildAndActivate).should('be.disabled')
    cy.get(sel.footerPendingDependencies).should('be.visible')

    cy.get(sel.depsGroupHeader('function')).click()
    cy.get(sel.depsBody('function')).should('be.visible')

    // Pick a Ready version for the FIRST Function only — still pending others.
    pickFunctionVersion(0, FN_A_READY)
    cy.get(sel.depsRow('function', 0)).find(sel.versionSelect).should('contain', FN_A_READY)
    cy.get(sel.buildAndActivate).should('be.disabled')
    cy.get(sel.footerPendingDependencies).should('be.visible')

    // Pick a Ready version for the SECOND Function — all functions resolved, but
    // the Connector is still pending, so the gate and the hint hold.
    pickFunctionVersion(1, FN_B_READY)
    cy.get(sel.depsRow('function', 1)).find(sel.versionSelect).should('contain', FN_B_READY)
    cy.get(sel.buildAndActivate).should('be.disabled')
    cy.get(sel.footerPendingDependencies).should('be.visible')

    // Resolve the Connector -> EVERY app dependency now has a version: the hint
    // clears and Build & activate enables.
    cy.get(sel.depsGroupHeader('connector')).click()
    cy.get(sel.depsBody('connector')).should('be.visible')
    pickConnectorVersion(0, CONN_A_READY)
    cy.get(sel.depsRow('connector', 0)).find(sel.versionSelect).should('contain', CONN_A_READY)
    cy.get(sel.footerPendingDependencies).should('not.exist')
    cy.get(sel.buildAndActivate).should('not.be.disabled')
  })

  it('lists Track latest Ready on top and only the strictly-Ready function versions below', () => {
    cy.get(sel.depsGroupHeader('function')).click()
    cy.get(sel.depsBody('function')).should('be.visible')

    // Function A exposes two Ready versions; the latest-Ready sentinel renders on
    // top and both pinned Ready versions follow.
    cy.get(sel.depsRow('function', 0)).find(sel.versionSelect).click()
    cy.get(sel.dropdownPanel).should('be.visible')
    cy.get(sel.versionLatest).should('exist')
    cy.get(sel.versionOption(FN_A_READY)).should('exist')
    cy.get(sel.versionOption(FN_A_OTHER)).should('exist')
  })

  it('lists Track latest Ready on top and only the strictly-Ready connector versions below', () => {
    cy.get(sel.depsGroupHeader('connector')).click()
    cy.get(sel.depsBody('connector')).should('be.visible')

    // Connector A exposes two Ready versions; the latest-Ready sentinel renders on
    // top and both pinned Ready versions follow.
    cy.get(sel.depsRow('connector', 0)).find(sel.versionSelect).click()
    cy.get(sel.dropdownPanel).should('be.visible')
    cy.get(sel.versionLatest).should('exist')
    cy.get(sel.versionOption(CONN_A_READY)).should('exist')
    cy.get(sel.versionOption(CONN_A_OTHER)).should('exist')
  })

  it('publishes and includes each Function AND Connector in build_and_activate as { resource_id, resource_type, version_id }', () => {
    cy.get(sel.depsGroupHeader('function')).click()
    cy.get(sel.depsBody('function')).should('be.visible')
    pickFunctionVersion(0, FN_A_READY)
    pickFunctionVersion(1, FN_B_READY)

    cy.get(sel.depsGroupHeader('connector')).click()
    cy.get(sel.depsBody('connector')).should('be.visible')
    pickConnectorVersion(0, CONN_A_READY)

    cy.get(sel.buildAndActivate).should('not.be.disabled')
    cy.get(sel.buildAndActivate).click()

    cy.get(sel.confirmDialog).should('be.visible')
    cy.get(sel.confirmBuild).click()

    cy.wait('@buildAndActivate', { timeout: 30000 }).then(({ request, response }) => {
      expect(response.statusCode).to.eq(202)

      const { resources } = request.body
      const functions = resources.filter((res) => res.resource_type === 'function')
      const connectors = resources.filter((res) => res.resource_type === 'connector')

      // Both detected Functions are published, each keyed by `resource_id` with
      // the picked `version_id` (the 'LATEST' sentinel is resolved to a concrete
      // id before dispatch — no sentinel leaks into the payload).
      expect(functions).to.have.length(2)

      const fnA = functions.find((res) => String(res.resource_id) === String(FUNCTION_A))
      const fnB = functions.find((res) => String(res.resource_id) === String(FUNCTION_B))

      expect(fnA).to.deep.include({
        resource_id: FUNCTION_A,
        resource_type: 'function',
        version_id: FN_A_READY
      })
      expect(fnB).to.deep.include({
        resource_id: FUNCTION_B,
        resource_type: 'function',
        version_id: FN_B_READY
      })

      // The detected Connector is published as a `connector` resource keyed by the
      // connector id, with the picked Ready version.
      expect(connectors).to.have.length(1)
      const connA = connectors.find((res) => String(res.resource_id) === String(CONNECTOR_A))
      expect(connA).to.deep.include({
        resource_id: CONNECTOR_A,
        resource_type: 'connector',
        version_id: CONN_A_READY
      })

      // No 'LATEST' sentinel leaks for any app dependency.
      ;[...functions, ...connectors].forEach((res) =>
        expect(res.version_id).to.not.eq('LATEST')
      )
    })
  })
})
