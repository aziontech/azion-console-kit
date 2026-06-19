/* eslint-disable cypress/unsafe-to-chain-command */
import selectors from '../../support/selectors'

const APPLICATION_ID = 1727808946
const DEPLOYMENT_ID = 'dep-prod-01'
const ENVIRONMENT_ID = 'env-prod-01'
const READY_VERSION_PRIMARY = '01J8READY0000000000000001'
const KEEP_FIREWALL_ID = 555000111

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

// Requests fired by the v6 EditView on mount (application + its versions).
const stubApplicationScreen = () => {
  cy.intercept('GET', `**/v4/workspace/applications/${APPLICATION_ID}`, {
    fixture: '/deploy-drawer/application.json'
  }).as('applicationDetail')

  cy.intercept('GET', `**/v4/workspace/applications/${APPLICATION_ID}/versions*`, {
    fixture: '/deploy-drawer/versions.json'
  }).as('applicationVersions')
}

// Listings fired by the drawer composable when the drawer opens (req 1.1/1.5).
const stubDrawerListings = () => {
  cy.intercept('GET', '**/v4/workspace/workloads*', {
    fixture: '/deploy-drawer/workloads.json'
  }).as('workloads')

  cy.intercept('GET', '**/environment-api/v4/environments*', {
    fixture: '/deploy-drawer/environments.json'
  }).as('environments')

  cy.intercept('GET', '**/deployment-api/v4/deployments*', {
    fixture: '/deploy-drawer/deployments.json'
  }).as('deployments')
}

const visitApplicationEdit = () => {
  cy.visit(`/applications/edit/${APPLICATION_ID}`)
  cy.wait('@accountInfo', { timeout: 30000 })
}

// Reusable drawer-open helper: opens Deploy and drives Workload + Environment,
// after which the composition + canary sections are revealed (design §3.1).
const openDrawerAndSelectTarget = () => {
  cy.get(selectors.deployDrawer.openButton).click()
  cy.get(selectors.deployDrawer.drawer).should('be.visible')

  cy.wait(['@workloads', '@environments', '@deployments'], { timeout: 30000 })

  // Step 1 — Workload.
  cy.get(selectors.deployDrawer.workloadSelect).click()
  cy.get(selectors.deployDrawer.dropdownOption).first().click()

  // Step 2 — Environment (single binding -> single card).
  cy.get(selectors.deployDrawer.environmentSelection).should('be.visible')
  cy.get(selectors.deployDrawer.environmentCard(ENVIRONMENT_ID)).should('be.visible')
  cy.get(selectors.deployDrawer.environmentRadio(ENVIRONMENT_ID)).click()
}

const selectVersion = () => {
  cy.get(selectors.deployDrawer.composition).should('be.visible')
  cy.get(selectors.deployDrawer.versionSelect).click()
  cy.get(selectors.deployDrawer.dropdownOption).first().click()
}

describe('Deploy Drawer - composition + canary (Mock Test)', { tags: ['@dev2'] }, () => {
  context('Feature flag gating (use_v6_configurations)', () => {
    it('does NOT mount the v6 deploy entry point when the flag is off', () => {
      stubAccountWithoutFlag()
      stubApplicationScreen()
      cy.login()
      visitApplicationEdit()

      // Flag off -> legacy TabsView renders; the v6 Deploy button never exists.
      cy.get(selectors.deployDrawer.openButton).should('not.exist')
    })

    it('mounts the v6 deploy entry point when the flag is on', () => {
      stubAccountWithFlag()
      stubApplicationScreen()
      cy.login()
      visitApplicationEdit()

      cy.wait('@applicationDetail', { timeout: 30000 })
      cy.get(selectors.deployDrawer.openButton).should('be.visible')
    })
  })

  context('Happy path - multi-resource composition + canary', () => {
    beforeEach(() => {
      stubAccountWithFlag()
      stubApplicationScreen()
      stubDrawerListings()

      // Active release with the context application + one extra resource ->
      // the rest-of-composition (keep[]) zone is populated (design §4.4).
      cy.intercept('GET', `**/deployment-api/v4/deployments/${DEPLOYMENT_ID}/releases*`, {
        fixture: '/deploy-drawer/active-release.json'
      }).as('activeRelease')

      cy.intercept(
        'POST',
        `**/deployment-api/v4/deployments/${DEPLOYMENT_ID}/build_and_activate`,
        { statusCode: 202, fixture: '/deploy-drawer/build-and-activate.json' }
      ).as('buildAndActivate')

      cy.login()
      visitApplicationEdit()
      cy.wait('@applicationDetail', { timeout: 30000 })
    })

    it('renders the composition with highlight + read-only rest (keep[])', () => {
      openDrawerAndSelectTarget()
      cy.wait('@activeRelease', { timeout: 30000 })

      // Zone A — highlight ("Deploying"): the context Application version field.
      cy.get(selectors.deployDrawer.compositionHighlight).should('be.visible')
      cy.get(selectors.deployDrawer.versionSelect).should('be.visible')

      // Zone B — rest of the composition: the active release's other resources,
      // read-only in v1 (`mode='resource'`).
      cy.get(selectors.deployDrawer.compositionRest).should('be.visible')
      cy.get(selectors.deployDrawer.compositionRestReadonly).should('be.visible')
      cy.get(selectors.deployDrawer.compositionKeep('firewall', KEEP_FIREWALL_ID)).should(
        'be.visible'
      )
    })

    it('deploys with a GRADUAL strategy and the multi-resource composition', () => {
      openDrawerAndSelectTarget()
      cy.wait('@activeRelease', { timeout: 30000 })
      selectVersion()

      // Toggle Canary -> reveal the gradual_rollout inputs (design §4.5).
      cy.get(selectors.deployDrawer.canaryToggle).click()
      cy.get(selectors.deployDrawer.canaryFields).should('be.visible')

      // Rollout mode (single GRADUAL option in ROLLOUT_MODE_OPTIONS).
      cy.get(selectors.deployDrawer.canaryRolloutMode).click()
      cy.get(selectors.deployDrawer.dropdownOption).first().click()

      // F5 inputs required while canary is on.
      cy.get(selectors.deployDrawer.canaryCandidatePercentage).find('input').clear()
      cy.get(selectors.deployDrawer.canaryCandidatePercentage).find('input').type('20')
      cy.get(selectors.deployDrawer.canaryCookieName).find('input').clear()
      cy.get(selectors.deployDrawer.canaryCookieName).find('input').type('azion_canary')
      cy.get(selectors.deployDrawer.canaryCookieMaxAge).find('input').clear()
      cy.get(selectors.deployDrawer.canaryCookieMaxAge).find('input').type('3600')

      cy.get(selectors.deployDrawer.confirm).should('not.be.disabled')
      cy.get(selectors.deployDrawer.confirm).click()

      cy.wait('@buildAndActivate', { timeout: 30000 }).then(({ request, response }) => {
        expect(response.statusCode).to.eq(202)

        const { resources, strategy } = request.body

        // Multi-resource: edited application (selected version) + carried keep[].
        expect(resources).to.have.length(2)
        const application = resources.find((res) => res.resource_type === 'application')
        const firewall = resources.find((res) => res.resource_type === 'firewall')

        expect(application.resource_id).to.eq(APPLICATION_ID)
        expect(application.resource_version).to.eq(READY_VERSION_PRIMARY)
        expect(firewall.resource_id).to.eq(KEEP_FIREWALL_ID)

        // Canary on -> GRADUAL strategy present (design §4.5 / P2).
        expect(strategy).to.exist
        expect(strategy.rollout_mode).to.eq('GRADUAL')
        expect(strategy.gradual_rollout).to.exist
      })

      cy.verifyToast('Deploy triggered')

      // Drawer closes on success; no polling — the next read uses the
      // refreshed cache (QKEY-001 / design §4.1).
      cy.get(selectors.deployDrawer.drawer).should('not.be.visible')
    })

    it('blocks Deploy until a version is selected (req 1.3 / 4.5)', () => {
      openDrawerAndSelectTarget()
      cy.wait('@activeRelease', { timeout: 30000 })

      // No version chosen yet -> confirm surfaces the required-version error and
      // never reaches the API.
      cy.get(selectors.deployDrawer.confirm).click()
      cy.get(selectors.deployDrawer.versionError).should('be.visible')
      cy.get('@buildAndActivate.all').should('have.length', 0)
    })
  })

  context('Regression - single-resource INSTANT path', () => {
    beforeEach(() => {
      stubAccountWithFlag()
      stubApplicationScreen()
      stubDrawerListings()

      // No active release -> minimal baseline: only the context resource, no
      // keep[] zone (design §4.2 / §5.1). This is the legacy single-resource flow.
      cy.intercept('GET', `**/deployment-api/v4/deployments/${DEPLOYMENT_ID}/releases*`, {
        fixture: '/deploy-drawer/active-release-empty.json'
      }).as('activeReleaseEmpty')

      cy.intercept(
        'POST',
        `**/deployment-api/v4/deployments/${DEPLOYMENT_ID}/build_and_activate`,
        { statusCode: 202, fixture: '/deploy-drawer/build-and-activate.json' }
      ).as('buildAndActivate')

      cy.login()
      visitApplicationEdit()
      cy.wait('@applicationDetail', { timeout: 30000 })
    })

    it('keeps the minimal baseline (no keep[] zone) when no active release exists', () => {
      openDrawerAndSelectTarget()
      cy.wait('@activeReleaseEmpty', { timeout: 30000 })

      cy.get(selectors.deployDrawer.compositionHighlight).should('be.visible')
      cy.get(selectors.deployDrawer.compositionRest).should('not.exist')
    })

    it('deploys a single resource with NO strategy when canary is off (P1)', () => {
      openDrawerAndSelectTarget()
      cy.wait('@activeReleaseEmpty', { timeout: 30000 })
      selectVersion()

      // Canary stays OFF -> INSTANT payload unchanged.
      cy.get(selectors.deployDrawer.canaryFields).should('not.exist')

      cy.get(selectors.deployDrawer.confirm).should('not.be.disabled')
      cy.get(selectors.deployDrawer.confirm).click()

      cy.wait('@buildAndActivate', { timeout: 30000 }).then(({ request }) => {
        const { resources, strategy } = request.body

        // Single resource (the context application), legacy INSTANT shape.
        expect(resources).to.have.length(1)
        expect(resources[0].resource_type).to.eq('application')
        expect(resources[0].resource_id).to.eq(APPLICATION_ID)
        expect(resources[0].resource_version).to.eq(READY_VERSION_PRIMARY)

        // No canary -> `strategy` omitted entirely (P1 / design §4.3).
        expect(strategy).to.be.undefined
      })

      cy.verifyToast('Deploy triggered')
      cy.get(selectors.deployDrawer.drawer).should('not.be.visible')
    })
  })
})
