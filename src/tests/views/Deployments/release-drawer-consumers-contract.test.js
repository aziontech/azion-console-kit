import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// The uniform rollback/redeploy contract lives in two places: the shared
// controller (`useReleaseDrawerController`, behaviorally tested in the composable
// suite) and how each of the 3 consumers declares its `actionable` value + wires
// the drawer. This suite pins that wiring so a consumer can't silently regress to
// a local-ref pattern or to a no-op action where it should be hidden.

const read = (relative) =>
  readFileSync(fileURLToPath(new URL(`../../../${relative}`, import.meta.url)), 'utf8')

const CONSUMERS = {
  DeploymentHistoryTab: {
    file: 'views/Deployments/tabs/DeploymentHistoryTab.vue',
    actionable: true
  },
  DeploymentVersionsList: {
    file: 'views/Deployments/components/DeploymentVersionsList.vue',
    actionable: false
  },
  WorkloadReleasesSection: {
    file: 'views/Workload/Tabs/sections/WorkloadReleasesSection.vue',
    actionable: false
  }
}

describe('Release drawer — uniform contract across the 3 consumers', () => {
  for (const [name, { file, actionable }] of Object.entries(CONSUMERS)) {
    describe(name, () => {
      const source = read(file)

      it('uses the shared controller (no duplicated local drawer refs)', () => {
        expect(source).toContain('useReleaseDrawerController')
        expect(source).toContain("from '@/composables/versioning/use-deployment-release-drawer'")
        // The shared state is the single source of visibility/selection.
        expect(source).toContain('DeploymentReleaseDrawer')
      })

      it(`declares actionable: ${actionable} consistently in controller and template`, () => {
        expect(source).toMatch(
          new RegExp(`useReleaseDrawerController\\(\\s*{[^}]*actionable:\\s*${actionable}`)
        )
        expect(source).toMatch(new RegExp(`:actionable="${actionable}"`))
      })
    })
  }

  it('only the history tab listens to rollback/redeploy; view-only consumers do not', () => {
    const history = read(CONSUMERS.DeploymentHistoryTab.file)
    expect(history).toContain('@rollback')
    expect(history).toContain('@redeploy')

    for (const file of [
      CONSUMERS.DeploymentVersionsList.file,
      CONSUMERS.WorkloadReleasesSection.file
    ]) {
      const source = read(file)
      // No-op + toast is forbidden: a non-actionable consumer must not bind the
      // action handlers at all (the drawer hides the button instead).
      expect(source).not.toContain('@rollback')
      expect(source).not.toContain('@redeploy')
    }
  })
})
