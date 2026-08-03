// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const read = (relative) =>
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), `../../../${relative}`), 'utf8')

const CONSUMERS = {
  ReleasesTab: {
    file: 'views/Deployments/tabs/ReleasesTab.vue',
    actionable: true
  },
  WorkloadReleasesSection: {
    file: 'views/Workload/v6/Tabs/sections/WorkloadReleasesSection.vue',
    actionable: false
  }
}

describe('Release drawer — uniform contract across consumers', () => {
  for (const [name, { file, actionable }] of Object.entries(CONSUMERS)) {
    describe(name, () => {
      const source = read(file)

      it('uses the shared controller (no duplicated local drawer refs)', () => {
        expect(source).toContain('useReleaseDrawerController')
        expect(source).toContain("from '@/composables/versioning/use-deployment-release-drawer'")
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

  it('only the releases tab listens to rollback/redeploy; view-only consumers do not', () => {
    const releases = read(CONSUMERS.ReleasesTab.file)
    expect(releases).toContain('@rollback')
    expect(releases).toContain('@redeploy')

    for (const file of [CONSUMERS.WorkloadReleasesSection.file]) {
      const source = read(file)
      expect(source).not.toContain('@rollback')
      expect(source).not.toContain('@redeploy')
    }
  })
})
