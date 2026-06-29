/* eslint-disable cypress/unsafe-to-chain-command */

/**
 * New Release ("Review & deploy") screen — mocked e2e.
 *
 * Covers the acceptance checklist in `New-Release-Screen-Spec.md` §I, end to
 * end, with every backend stubbed (no real API). The screen is the full-page
 * realization of the prepared "release / edit-all" mode, gated by the
 * `use_v6_configurations` flag and reachable at `/deployments/releases/new`.
 *
 * Verified API shapes (spec §L) drive the stubs:
 *   - List DS:            GET /deployment-api/v4/deployments
 *   - Active release:     GET /deployment-api/v4/deployments/{id}/releases?traffic_role=active
 *   - Build & activate:   POST /deployment-api/v4/deployments/{id}/build_and_activate -> 202
 *   - Resource catalog:   GET /v4/workspace/applications        (RESOURCE_CATALOG_REGISTRY)
 *   - Resource versions:  GET /v4/workspace/applications/{id}/versions
 *
 * All assertions use the `release-composition__*` data-testids the components
 * expose, never copy text, so the spec is resilient to wording changes.
 *
 * The Impact reverse lookup (DS -> workloads/domains) is service-to-service only
 * today (spec §F/§K), so the panel is expected to degrade to "unavailable +
 * Retry" by default while Build & activate stays enabled — asserted below.
 */

const sel = {
  // Page shell.
  view: '[data-testid="release-composition__view"]',
  grid: '[data-testid="release-composition__grid"]',
  compositionCard: '[data-testid="release-composition__composition-card"]',
  impactCard: '[data-testid="release-composition__impact-card"]',

  // Composition tree (order:1) — ReleaseCompositionField. NOTE: the parent's
  // `release-composition__tree` data-testid does NOT survive attribute
  // fallthrough (the child root sets its own `release-composition__composition`
  // testid, which wins), so the composition root is matched by `composition`.
  composition: '[data-testid="release-composition__composition"]',
  compositionApplication: '[data-testid="release-composition__composition-application"]',
  compositionScoped: '[data-testid="release-composition__composition-scoped"]',

  // Version picker (ResourceVersionField) — grouped dropdown, appendTo body.
  versionSelect: '[data-testid="release-composition__version-select"]',
  versionLatest: '[data-testid="release-composition__version-latest"]',
  versionOption: (value) => `[data-testid="release-composition__version-option-${value}"]`,

  // Dependencies (ReleaseDependenciesSection) — nested, no "Add".
  depsSection: '[data-testid="release-composition__deps-section"]',
  depsGroup: (type) => `[data-testid="release-composition__deps-group-${type}"]`,
  depsGroupHeader: (type) => `[data-testid="release-composition__deps-group-header-${type}"]`,
  depsBody: (type) => `[data-testid="release-composition__deps-body-${type}"]`,
  depsRow: (type, id) => `[data-testid="release-composition__deps-row-${type}-${id}"]`,
  depsRemove: (type, id) => `[data-testid="release-composition__deps-remove-${type}-${id}"]`,

  // DS picker (DeploymentSettingsPicker, order:2).
  dsPicker: '[data-testid="release-composition__ds-picker"]',
  dsSearch: '[data-testid="release-composition__ds-search"]',
  dsSelectedCounter: '[data-testid="release-composition__ds-selected-counter"]',
  dsList: '[data-testid="release-composition__ds-list"]',
  dsEmpty: '[data-testid="release-composition__ds-empty"]',
  dsBindEnvironment: '[data-testid="release-composition__ds-bind-environment"]',
  dsRow: (id) => `[data-testid="release-composition__ds-row-${id}"]`,
  dsCheckbox: (id) => `#release-composition__ds-checkbox-${id}`,
  dsEnvironment: (id) => `[data-testid="release-composition__ds-environment-${id}"]`,
  dsWorkloads: (id) => `[data-testid="release-composition__ds-workloads-${id}"]`,
  dsPolicy: (id) => `[data-testid="release-composition__ds-policy-${id}"]`,

  // Canary (CanaryStrategyField, order:3 — always last).
  canary: '[data-testid="release-composition__canary"]',
  canaryToggle: '[data-testid="release-composition__canary-toggle"] .p-inputswitch-slider',
  canaryFields: '[data-testid="release-composition__canary-fields"]',

  // Impact panel (ImpactPanel).
  impactPanel: '[data-testid="release-composition__impact-panel"]',
  impactEmpty: '[data-testid="release-composition__impact-empty"]',
  impactUnavailable: '[data-testid="release-composition__impact-unavailable"]',
  impactRetry: '[data-testid="release-composition__impact-retry"]',
  impactTree: '[data-testid="release-composition__impact-tree"]',

  // Footer + confirm.
  footer: '[data-testid="release-composition__footer"]',
  footerBlocked: '[data-testid="release-composition__footer-blocked"]',
  buildAndActivate: '[data-testid="release-composition__build-and-activate"]',
  cancel: '[data-testid="release-composition__cancel"]',
  confirmDialog: '[data-testid="release-composition__confirm-dialog"]',
  confirmSummary: '[data-testid="release-composition__confirm-summary"]',
  confirmBuild: '[data-testid="release-composition__confirm-build"]',
  confirmCancel: '[data-testid="release-composition__confirm-cancel"]',

  // Shared PrimeVue dropdown internals (webkit Dropdown), rendered to <body>.
  dropdownPanel: '.p-dropdown-panel',
  dropdownItem: '.p-dropdown-panel .p-dropdown-item'
}

// --- Stub data (verified shapes, spec §L) -----------------------------------

const APPLICATION_ID = 1727808946
const READY_PRIMARY = '01J8READY0000000000000001'
const READY_SECONDARY = '01J8READY0000000000000002'
const FUNCTION_ID = 76691
const FUNCTION_VERSION = 'AYQSKKFU'

// Two DS under DIFFERENT policies, so the multi-DS gate (strictest) is testable.
const DS_SINGLE = 'dep-magalu-storefront' // single_version
const DS_VERSIONED = 'dep-storefront-canary' // versioned_urls
// A third DS that has NO active release / no Application -> Case 1 (blocks).
const DS_NO_APP = 'dep-empty-shell'

const deploymentsList = {
  count: 3,
  results: [
    {
      id: DS_SINGLE,
      name: 'magalu-storefront',
      deployment_policy: 'single_version',
      state: 'active',
      created_at: '2026-05-01T10:00:00Z',
      updated_at: '2026-06-01T12:00:00Z'
    },
    {
      id: DS_VERSIONED,
      name: 'storefront-canary',
      deployment_policy: 'versioned_urls',
      state: 'active',
      created_at: '2026-05-01T10:00:00Z',
      updated_at: '2026-06-01T12:00:00Z'
    },
    {
      id: DS_NO_APP,
      name: 'empty-shell',
      deployment_policy: 'single_version',
      state: 'active',
      created_at: '2026-05-01T10:00:00Z',
      updated_at: '2026-06-01T12:00:00Z'
    }
  ]
}

// Active release for the single-version DS: carries an Application + a Function
// dependency (so the nested dependencies section is seeded — spec §C.2 / §L).
const activeReleaseSingle = {
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
          version_id: READY_PRIMARY
        },
        {
          resource_type: 'function',
          resource_id: FUNCTION_ID,
          global_id: null,
          version_id: FUNCTION_VERSION
        }
      ]
    }
  ]
}

// Active release for the versioned DS: an Application only.
const activeReleaseVersioned = {
  results: [
    {
      id: 'rel-storefront-search',
      traffic_role: 'ACTIVE',
      state: 'ready',
      resources: [
        {
          resource_type: 'application',
          global_id: APPLICATION_ID,
          resource_id: null,
          version_id: READY_PRIMARY
        }
      ]
    }
  ]
}

// The no-app DS has no active release -> Case 1 (no Application, button blocked).
const activeReleaseEmpty = { results: [] }

const applicationsCatalog = {
  count: 1,
  results: [{ id: APPLICATION_ID, name: 'deploy-drawer-app', product_version: '2.0' }]
}

// Two Ready versions: latest-Ready sentinel renders on top, these pin below.
// `comment` is intentionally omitted so the picker label falls back to the
// short_id hash (`toVersionOptions`: `label = comment || id`), keeping the
// assertions hash-based rather than copy-based.
const applicationVersions = {
  count: 2,
  results: [
    {
      version_id: READY_PRIMARY,
      version_state: 'ready',
      created_at: '2026-06-10T09:00:00Z',
      last_editor: 'qa@azion.com'
    },
    {
      version_id: READY_SECONDARY,
      version_state: 'ready',
      created_at: '2026-06-05T09:00:00Z',
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

const stubAccountWithoutFlag = () => {
  cy.intercept('GET', '/api/account/info', {
    fixture: '/account/info/workload_flags.json'
  }).as('accountInfo')
}

// Listings + reads the composable fires (deployments + per-DS active release +
// the resource catalog and per-resource versions for the pickers).
const stubReleaseListings = () => {
  cy.intercept('GET', '**/deployment-api/v4/deployments?*', { body: deploymentsList }).as(
    'deployments'
  )

  cy.intercept('GET', `**/deployment-api/v4/deployments/${DS_SINGLE}/releases?*`, {
    body: activeReleaseSingle
  }).as('activeReleaseSingle')

  cy.intercept('GET', `**/deployment-api/v4/deployments/${DS_VERSIONED}/releases?*`, {
    body: activeReleaseVersioned
  }).as('activeReleaseVersioned')

  cy.intercept('GET', `**/deployment-api/v4/deployments/${DS_NO_APP}/releases?*`, {
    body: activeReleaseEmpty
  }).as('activeReleaseEmpty')

  // The composer primes the Application + optional-singleton catalogs on mount.
  cy.intercept('GET', '**/v4/workspace/applications?*', { body: applicationsCatalog }).as(
    'applicationsCatalog'
  )
  cy.intercept('GET', '**/v4/workspace/applications/*/versions*', {
    body: applicationVersions
  }).as('applicationVersions')

  // Optional-singleton + dependency catalogs the screen may prime — keep them
  // empty so nothing is fabricated; they must never break the screen.
  cy.intercept('GET', '**/v4/workspace/firewalls?*', { body: emptyList }).as('firewalls')
  cy.intercept('GET', '**/v4/workspace/custom_pages?*', { body: emptyList }).as('customPages')
  cy.intercept('GET', '**/v4/workspace/functions?*', { body: emptyList }).as('functions')
  cy.intercept('GET', '**/v4/workspace/connectors?*', { body: emptyList }).as('connectors')
  cy.intercept('GET', '**/v4/workspace/network_lists?*', { body: emptyList }).as('networkLists')
  cy.intercept('GET', '**/v4/workspace/wafs?*', { body: emptyList }).as('wafs')
}

const stubBuildAndActivate = () => {
  cy.intercept('POST', '**/deployment-api/v4/deployments/*/build_and_activate', {
    statusCode: 202,
    body: buildAndActivateResponse
  }).as('buildAndActivate')
}

// Entry from a Resource (Deploy <version>): the route carries the scoped type,
// the resource id, a preset Ready version, and the consuming DS the source
// resolved client-side (task 13.1 passes `deploymentIds: consumingDsIds`). With
// the consuming DS already known, the composition renders FIRST with the DS
// pre-selected (spec §A, checklist #1). The single-version DS carries the
// Application + a Function dependency, so the nested deps section is seeded.
const visitFromResource = () => {
  cy.visit(
    `/deployments/releases/new?fromVersion=true&scopedType=application&resourceId=${APPLICATION_ID}&versionId=${READY_PRIMARY}&deploymentIds=${DS_SINGLE}`
  )
  cy.wait('@accountInfo', { timeout: 30000 })
}

// Entry from a Deployment Setting (New Release, DS-first): no scoped resource.
const visitFromDeployment = () => {
  cy.visit('/deployments/releases/new')
  cy.wait('@accountInfo', { timeout: 30000 })
}

// Toggle a DS by clicking its row label (which wraps the webkit Checkbox). The
// label-for-input wiring makes this drive the array v-model the same way a real
// click does, without depending on the visually-hidden PrimeVue input.
const checkDs = (id) => {
  cy.get(sel.dsRow(id)).scrollIntoView()
  cy.get(sel.dsRow(id)).click()
}

describe('New Release - Review & deploy (Mock Test)', { tags: ['@dev2'] }, () => {
  context('Feature flag gating (use_v6_configurations)', () => {
    it('redirects away from releases/new when the flag is off', () => {
      stubAccountWithoutFlag()
      stubReleaseListings()
      cy.login()
      visitFromDeployment()

      // Flag off -> flagGuard redirects to /not-found; the view never mounts.
      cy.get(sel.view).should('not.exist')
      cy.location('pathname').should('not.eq', '/deployments/releases/new')
    })

    it('mounts the full-page composer when the flag is on', () => {
      stubAccountWithFlag()
      stubReleaseListings()
      cy.login()
      visitFromDeployment()

      cy.get(sel.view).should('be.visible')
      cy.get(sel.compositionCard).should('be.visible')
      cy.get(sel.impactCard).should('be.visible')
    })
  })

  context('Entry: open from a Deployment Setting (DS-first) - checklist #2', () => {
    beforeEach(() => {
      stubAccountWithFlag()
      stubReleaseListings()
      cy.login()
      visitFromDeployment()
      cy.wait('@deployments', { timeout: 30000 })
    })

    it('shows the DS picker first; the composition appears once a DS is checked', () => {
      // DS-first: no scoped resource was passed, so nothing is composed yet and
      // the composition tree stays hidden until a DS is selected (spec §B/§D).
      cy.get(sel.dsPicker).should('be.visible')
      cy.get(sel.composition).should('not.exist')
      cy.get(sel.canary).should('not.exist')

      checkDs(DS_VERSIONED)
      cy.wait('@activeReleaseVersioned', { timeout: 30000 })

      // Now the composition + canary reveal (spec §B order: composition -> canary).
      cy.get(sel.composition).should('be.visible')
      cy.get(sel.canary).should('be.visible')
    })

    it('renders DS rows with policy tag, multi-select, search and the selected counter', () => {
      // Checklist #3 — rows expose a policy tag and a checkbox; Environment /
      // workloads are OMITTED (not fabricated) because the reverse lookup is
      // unreachable today (spec §D/§F/§K).
      cy.get(sel.dsRow(DS_SINGLE)).should('be.visible')
      cy.get(sel.dsRow(DS_VERSIONED)).should('be.visible')
      cy.get(sel.dsPolicy(DS_SINGLE)).should('be.visible')
      cy.get(sel.dsPolicy(DS_VERSIONED)).should('be.visible')
      cy.get(sel.dsEnvironment(DS_SINGLE)).should('not.exist')
      cy.get(sel.dsWorkloads(DS_SINGLE)).should('not.exist')

      // Multi-select: two DS checked -> counter reflects the selection.
      cy.get(sel.dsSelectedCounter).should('contain', '0 selected')
      checkDs(DS_SINGLE)
      checkDs(DS_VERSIONED)
      cy.get(sel.dsSelectedCounter).should('contain', '2 selected')

      // Search filters the list down to the matching DS only.
      cy.get(sel.dsSearch).clear()
      cy.get(sel.dsSearch).type('canary')
      cy.get(sel.dsRow(DS_VERSIONED)).should('be.visible')
      cy.get(sel.dsRow(DS_SINGLE)).should('not.exist')
    })

    it('keeps the Canary block as the last composition child (flex order:3)', () => {
      // Checklist #5 — Canary is always last and a DIRECT child (order classes).
      checkDs(DS_VERSIONED)
      cy.wait('@activeReleaseVersioned', { timeout: 30000 })

      // The `order-1` class merges onto the ReleaseCompositionField root (which
      // itself carries the `release-composition__composition` testid — the child's
      // explicit data-testid wins the fallthrough, class is merged).
      cy.get(sel.composition).should('have.class', 'order-1')
      cy.get(sel.dsPicker).should('have.class', 'order-2')
      cy.get(sel.canary).should('have.class', 'order-3')

      // Canary fields stay hidden until the toggle is switched on (gradual rollout).
      cy.get(sel.canaryFields).should('not.exist')
      cy.get(sel.canaryToggle).click()
      cy.get(sel.canaryFields).should('be.visible')
    })
  })

  context('DS picker empty state - checklist #3', () => {
    it('shows the empty message + Bind Environment when there are no Deployment Settings', () => {
      stubAccountWithFlag()
      stubReleaseListings()
      // Override the deployments listing with an empty result for this test.
      cy.intercept('GET', '**/deployment-api/v4/deployments?*', {
        body: { count: 0, results: [] }
      }).as('deploymentsEmpty')
      cy.login()
      visitFromDeployment()
      cy.wait('@deploymentsEmpty', { timeout: 30000 })

      cy.get(sel.dsEmpty).should('be.visible')
      cy.get(sel.dsBindEnvironment).should('be.visible')
      // Nothing is selectable, so the deploy button stays disabled.
      cy.get(sel.buildAndActivate).should('be.disabled')
    })
  })

  context('Entry: open from a Resource (Deploy <version>) - checklist #1', () => {
    beforeEach(() => {
      stubAccountWithFlag()
      stubReleaseListings()
      stubBuildAndActivate()
      cy.login()
      visitFromResource()
      cy.wait('@deployments', { timeout: 30000 })
    })

    it('composes the scoped Application with a preset Ready version and a pre-selected DS', () => {
      // The consuming DS arrives pre-selected from the entry (task 13.1 resolves
      // it client-side at the source), so the composition shows FIRST (spec §A/§C).
      cy.get(sel.composition).should('be.visible')
      cy.get(sel.dsSelectedCounter).should('not.contain', '0 selected')

      // Preset Ready version: the picker shows the pinned hash, not the empty
      // placeholder (spec §C.3, checklist #1/#6).
      cy.get(sel.versionSelect).first().should('contain', READY_PRIMARY)

      // Build & activate is enabled once a DS + an app version resolve.
      cy.get(sel.buildAndActivate).should('not.be.disabled')
    })

    it('offers latest-Ready on top and the pinned Ready versions below (checklist #6)', () => {
      // Open the Application version picker; the grouped panel renders to <body>.
      cy.get(sel.versionSelect).first().click()
      cy.get(sel.dropdownPanel).should('be.visible')

      // Sentinel "Track latest Ready" is the FIRST option; pinned Ready versions
      // (both seeded as `ready`) follow.
      cy.get(sel.dropdownItem).first().find(sel.versionLatest).should('exist')
      cy.get(sel.versionOption(READY_PRIMARY)).should('exist')
      cy.get(sel.versionOption(READY_SECONDARY)).should('exist')

      // Pin a different Ready version; the trigger updates to the new hash.
      cy.get(sel.versionOption(READY_SECONDARY)).click()
      cy.get(sel.versionSelect).first().should('contain', READY_SECONDARY)
    })

    it('shows editable nested dependencies with a remove control and no "Add" (checklist #4)', () => {
      // The single-version DS active release carries a Function dependency, seeded
      // into the nested section (instance set INHERITED — no "Add").
      cy.get(sel.depsSection).should('exist')
      cy.get(sel.depsGroupHeader('function')).click()
      cy.get(sel.depsBody('function')).should('be.visible')
      cy.get(sel.depsRow('function', 0)).should('be.visible')
      cy.get(sel.depsRemove('function', 0)).should('be.visible')

      // No "Add" control anywhere in the dependencies section.
      cy.get(sel.depsSection).contains(/add/i).should('not.exist')

      // Remove drops the only instance -> the row disappears.
      cy.get(sel.depsRemove('function', 0)).click()
      cy.get(sel.depsRow('function', 0)).should('not.exist')
    })

    it('confirms on activate, then fires one build_and_activate per selected DS (checklist #9)', () => {
      cy.get(sel.buildAndActivate).should('not.be.disabled')
      cy.get(sel.buildAndActivate).click()

      // The confirm modal gates the dispatch (spec §G).
      cy.get(sel.confirmDialog).should('be.visible')
      cy.get(sel.confirmSummary).should('be.visible')

      cy.get(sel.confirmBuild).click()

      // Async (202): the verified payload shape carries the resolved version_id
      // (no 'LATEST' sentinel) and keys the Application by global_id (spec §L / P6).
      cy.wait('@buildAndActivate', { timeout: 30000 }).then(({ request, response }) => {
        expect(response.statusCode).to.eq(202)
        const { resources } = request.body
        const application = resources.find((res) => res.resource_type === 'application')
        expect(application.global_id).to.eq(APPLICATION_ID)
        expect(application.version_id).to.eq(READY_PRIMARY)
        expect(application.version_id).to.not.eq('LATEST')
      })
    })
  })

  context('Deploy cases gate the button (5 cases, strictest) - checklist #7', () => {
    beforeEach(() => {
      stubAccountWithFlag()
      stubReleaseListings()
      cy.login()
      visitFromDeployment()
      cy.wait('@deployments', { timeout: 30000 })
    })

    it('Case 1: a selected DS with no Application disables Build & activate', () => {
      // The empty-shell DS has no active release -> no Application -> Case 1.
      // The view surfaces it through the deploy gate: the button is disabled and
      // the footer names the blocking DS (the composition card still renders an
      // editable Application selector so the user can resolve it).
      checkDs(DS_NO_APP)
      cy.wait('@activeReleaseEmpty', { timeout: 30000 })

      cy.get(sel.buildAndActivate).should('be.disabled')
      cy.get(sel.footerBlocked).should('be.visible').and('contain', 'has no Application')
    })

    it('multi-DS gates on the strictest: one Case-1 DS blocks the whole deploy', () => {
      // A deployable DS that pins an Application clears the per-DS gate...
      checkDs(DS_VERSIONED)
      cy.wait('@activeReleaseVersioned', { timeout: 30000 })

      // ...but adding the no-Application DS folds to the strictest case and blocks:
      // the button is disabled and the footer names the offending DS.
      checkDs(DS_NO_APP)
      cy.wait('@activeReleaseEmpty', { timeout: 30000 })

      cy.get(sel.buildAndActivate).should('be.disabled')
      cy.get(sel.footerBlocked).should('be.visible')
    })
  })

  context('Impact panel degrades by default - checklist #8', () => {
    beforeEach(() => {
      stubAccountWithFlag()
      stubReleaseListings()
      cy.login()
      visitFromDeployment()
      cy.wait('@deployments', { timeout: 30000 })
    })

    it('shows "unavailable + Retry" and keeps Build & activate enabled', () => {
      // Empty state before any DS is selected.
      cy.get(sel.impactEmpty).should('be.visible')

      checkDs(DS_VERSIONED)
      cy.wait('@activeReleaseVersioned', { timeout: 30000 })

      // Reverse lookup is s2s-only (spec §F/§K) -> degraded unavailable + Retry,
      // never a fabricated tree (Property 8).
      cy.get(sel.impactUnavailable).should('be.visible')
      cy.get(sel.impactRetry).should('be.visible')
      cy.get(sel.impactTree).should('not.exist')

      // The deploy is unaffected by the missing impact.
      cy.get(sel.buildAndActivate).should('not.be.disabled')

      // Retry re-primes the listing but stays degraded (no fabrication).
      cy.get(sel.impactRetry).click()
      cy.get(sel.impactUnavailable).should('be.visible')
      cy.get(sel.buildAndActivate).should('not.be.disabled')
    })
  })

  context('Responsive layout - checklist #10', () => {
    beforeEach(() => {
      stubAccountWithFlag()
      stubReleaseListings()
      cy.login()
    })

    it('stacks the columns below 880px with no horizontal overflow', () => {
      cy.viewport(800, 900)
      visitFromDeployment()
      cy.wait('@deployments', { timeout: 30000 })
      cy.get(sel.view).should('be.visible')

      // Single-column stack: the grid template collapses to one track, so the
      // two cards sit at the same left offset (stacked, not side by side).
      cy.get(sel.compositionCard).then(($composition) => {
        cy.get(sel.impactCard).then(($impact) => {
          expect($impact[0].offsetLeft).to.eq($composition[0].offsetLeft)
        })
      })

      // No horizontal overflow: the document never scrolls sideways.
      cy.document().then((doc) => {
        const root = doc.documentElement
        expect(root.scrollWidth).to.be.at.most(root.clientWidth + 1)
      })
    })
  })
})
