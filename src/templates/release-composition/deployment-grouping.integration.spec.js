import { describe, it, expect } from 'vitest'
import { classifyDeploymentsForResource } from '@/templates/release-composition/classify-deployments-for-resource'

const GROUP_LABELS = {
  linked: 'Already using this resource',
  available: 'Not using this resource yet',
  needsFirstRelease: 'Needs a first release',
  loadFailed: "Couldn't load the active release"
}

const labelFor = (group) => GROUP_LABELS[group.key]

describe('release-composition deployment grouping (integration)', () => {
  describe('application scope (release keyed by global_id)', () => {
    const scopedType = 'application'
    const scopedResourceId = 'app-42'

    const dsFlexibleLinked = { id: 'ds-flex-linked', binding_policy: 'FLEXIBLE' }
    const dsStrictLinked = { id: 'ds-strict-linked', binding_policy: 'STRICT' }
    const dsFlexibleUnlinked = { id: 'ds-flex-unlinked', binding_policy: 'FLEXIBLE' }
    const dsStrictNoResource = { id: 'ds-strict-empty', binding_policy: 'STRICT' }
    const dsStrictOther = { id: 'ds-strict-other', binding_policy: 'STRICT' }
    const dsFlexibleOther = { id: 'ds-flex-other', binding_policy: 'FLEXIBLE' }

    const deployments = [
      dsFlexibleLinked,
      dsStrictLinked,
      dsFlexibleUnlinked,
      dsStrictNoResource,
      dsStrictOther,
      dsFlexibleOther
    ]

    const activeReleaseByDs = {
      [dsFlexibleLinked.id]: {
        resources: [{ resource_type: scopedType, global_id: 'app-42' }]
      },
      [dsStrictLinked.id]: {
        resources: [{ resource_type: scopedType, global_id: 'app-42' }]
      },
      [dsFlexibleUnlinked.id]: {
        resources: [{ resource_type: 'connector', resource_id: 'conn-1' }]
      },
      [dsStrictNoResource.id]: {
        resources: [{ resource_type: 'connector', resource_id: 'conn-2' }]
      },
      [dsStrictOther.id]: {
        resources: [{ resource_type: scopedType, global_id: 'app-99' }]
      },
      [dsFlexibleOther.id]: {
        resources: [{ resource_type: scopedType, global_id: 'app-99' }]
      }
    }

    const run = () =>
      classifyDeploymentsForResource({
        deployments,
        activeReleaseByDs,
        scopedType,
        scopedResourceId
      })

    it('produces the correct English labels for both groups', () => {
      const { groups } = run()

      expect(groups.map(labelFor)).toEqual([
        'Already using this resource',
        'Not using this resource yet',
        'Needs a first release',
        "Couldn't load the active release"
      ])
    })

    it('places each deployment in the expected group', () => {
      const { groups, hidden } = run()
      const [linked, available] = groups
      const idsOf = (group) => group.deployments.map((deployment) => deployment.id)

      expect(idsOf(linked)).toEqual([dsFlexibleLinked.id, dsStrictLinked.id])
      expect(idsOf(available)).toEqual([
        dsFlexibleUnlinked.id,
        dsStrictNoResource.id,
        dsFlexibleOther.id
      ])
      expect(hidden.map((deployment) => deployment.id)).toEqual([dsStrictOther.id])
    })

    it('hides the STRICT deployment bound to a different resource of the same type', () => {
      const { groups } = run()
      const [linked, available] = groups
      const visibleIds = [...linked.deployments, ...available.deployments].map(
        (deployment) => deployment.id
      )

      expect(visibleIds).not.toContain(dsStrictOther.id)
    })

    it('lets a FLEXIBLE deployment bound to a different resource land in available', () => {
      const { groups } = run()
      const [, available] = groups

      expect(available.deployments.map((deployment) => deployment.id)).toContain(dsFlexibleOther.id)
    })

    it('builds a cross-group multi-selection whose id set contains the picked deployments', () => {
      const { groups } = run()
      const [linked, available] = groups

      const picked = [linked.deployments[0], available.deployments[0]]
      const selectedIds = new Set(picked.map((deployment) => deployment.id))

      expect(selectedIds.has(dsFlexibleLinked.id)).toBe(true)
      expect(selectedIds.has(dsFlexibleUnlinked.id)).toBe(true)
      expect(selectedIds.size).toBe(2)
    })
  })

  describe('firewall scope (release keyed by resource_id)', () => {
    const scopedType = 'firewall'
    const scopedResourceId = 'fw-7'

    const dsFlexibleLinked = { id: 'fw-flex-linked', binding_policy: 'FLEXIBLE' }
    const dsStrictLinked = { id: 'fw-strict-linked', binding_policy: 'STRICT' }
    const dsFlexibleUnlinked = { id: 'fw-flex-unlinked', binding_policy: 'FLEXIBLE' }
    const dsStrictNoResource = { id: 'fw-strict-empty', binding_policy: 'STRICT' }
    const dsStrictOther = { id: 'fw-strict-other', binding_policy: 'STRICT' }
    const dsFlexibleOther = { id: 'fw-flex-other', binding_policy: 'FLEXIBLE' }

    const deployments = [
      dsFlexibleLinked,
      dsStrictLinked,
      dsFlexibleUnlinked,
      dsStrictNoResource,
      dsStrictOther,
      dsFlexibleOther
    ]

    const activeReleaseByDs = {
      [dsFlexibleLinked.id]: {
        resources: [{ resource_type: scopedType, resource_id: 'fw-7' }]
      },
      [dsStrictLinked.id]: {
        resources: [{ resource_type: scopedType, resource_id: 'fw-7' }]
      },
      [dsFlexibleUnlinked.id]: {
        resources: [{ resource_type: 'application', global_id: 'app-1' }]
      },
      [dsStrictNoResource.id]: {
        resources: [{ resource_type: 'application', global_id: 'app-2' }]
      },
      [dsStrictOther.id]: {
        resources: [{ resource_type: scopedType, resource_id: 'fw-99' }]
      },
      [dsFlexibleOther.id]: {
        resources: [{ resource_type: scopedType, resource_id: 'fw-99' }]
      }
    }

    const run = () =>
      classifyDeploymentsForResource({
        deployments,
        activeReleaseByDs,
        scopedType,
        scopedResourceId
      })

    it('produces the correct English labels for both groups', () => {
      const { groups } = run()

      expect(groups.map(labelFor)).toEqual([
        'Already using this resource',
        'Not using this resource yet',
        'Needs a first release',
        "Couldn't load the active release"
      ])
    })

    it('places each deployment in the expected group and hides the mismatched STRICT one', () => {
      const { groups, hidden } = run()
      const [linked, available] = groups
      const idsOf = (group) => group.deployments.map((deployment) => deployment.id)

      expect(idsOf(linked)).toEqual([dsFlexibleLinked.id, dsStrictLinked.id])
      expect(idsOf(available)).toEqual([
        dsFlexibleUnlinked.id,
        dsStrictNoResource.id,
        dsFlexibleOther.id
      ])
      expect(hidden.map((deployment) => deployment.id)).toEqual([dsStrictOther.id])

      const visibleIds = [...linked.deployments, ...available.deployments].map(
        (deployment) => deployment.id
      )
      expect(visibleIds).not.toContain(dsStrictOther.id)
    })

    it('builds a cross-group multi-selection whose id set contains the picked deployments', () => {
      const { groups } = run()
      const [linked, available] = groups

      const picked = [linked.deployments[1], available.deployments[2]]
      const selectedIds = new Set(picked.map((deployment) => deployment.id))

      expect(selectedIds.has(dsStrictLinked.id)).toBe(true)
      expect(selectedIds.has(dsFlexibleOther.id)).toBe(true)
      expect(selectedIds.size).toBe(2)
    })
  })

  describe('needs-first-release (no active release to override)', () => {
    const scopedType = 'firewall'
    const scopedResourceId = 'fw-7'

    const dsWithRelease = { id: 'ds-has-release', binding_policy: 'FLEXIBLE' }
    const dsNoRelease = { id: 'ds-no-release', binding_policy: 'FLEXIBLE' }

    const activeReleaseByDs = {
      [dsWithRelease.id]: { resources: [{ resource_type: 'application', global_id: 'app-1' }] }
    }

    const idsOf = (group) => group.deployments.map((deployment) => deployment.id)

    it('routes a DS with no active release into needsFirstRelease in scoped mode', () => {
      const { groups } = classifyDeploymentsForResource({
        deployments: [dsWithRelease, dsNoRelease],
        activeReleaseByDs,
        scopedType,
        scopedResourceId
      })
      const [, available, needsFirstRelease] = groups

      expect(idsOf(needsFirstRelease)).toEqual([dsNoRelease.id])
      expect(idsOf(available)).toEqual([dsWithRelease.id])
    })

    it('keeps a DS whose release lacks this resource in available, not needsFirstRelease', () => {
      const { groups } = classifyDeploymentsForResource({
        deployments: [dsWithRelease],
        activeReleaseByDs,
        scopedType,
        scopedResourceId
      })
      const [, available, needsFirstRelease] = groups

      expect(idsOf(available)).toEqual([dsWithRelease.id])
      expect(needsFirstRelease.deployments).toEqual([])
    })

    it('does NOT segregate in non-scoped mode: a DS with no release stays available', () => {
      const { groups } = classifyDeploymentsForResource({
        deployments: [dsNoRelease],
        activeReleaseByDs,
        scopedType: null,
        scopedResourceId: undefined
      })
      const [, available, needsFirstRelease] = groups

      expect(idsOf(available)).toEqual([dsNoRelease.id])
      expect(needsFirstRelease.deployments).toEqual([])
    })
  })

  describe('load-failed (active-release read failed, not a genuine first-release)', () => {
    const scopedType = 'firewall'
    const scopedResourceId = 'fw-7'

    const dsWithRelease = { id: 'ds-has-release', binding_policy: 'FLEXIBLE' }
    const dsReadFailed = { id: 'ds-read-failed', binding_policy: 'FLEXIBLE' }
    const dsNoRelease = { id: 'ds-no-release', binding_policy: 'FLEXIBLE' }

    const activeReleaseByDs = {
      [dsWithRelease.id]: { resources: [{ resource_type: scopedType, resource_id: 'fw-7' }] }
    }

    const groupsByKey = (groups) =>
      Object.fromEntries(
        groups.map((group) => [group.key, group.deployments.map((deployment) => deployment.id)])
      )

    it('routes a failed-read DS into loadFailed, not needsFirstRelease', () => {
      const { groups } = classifyDeploymentsForResource({
        deployments: [dsWithRelease, dsReadFailed, dsNoRelease],
        activeReleaseByDs,
        scopedType,
        scopedResourceId,
        failedDsIds: [dsReadFailed.id]
      })
      const byKey = groupsByKey(groups)

      expect(byKey.loadFailed).toEqual([dsReadFailed.id])
      expect(byKey.needsFirstRelease).toEqual([dsNoRelease.id])
      expect(byKey.linked).toEqual([dsWithRelease.id])
    })

    it('accepts a Set for failedDsIds', () => {
      const { groups } = classifyDeploymentsForResource({
        deployments: [dsReadFailed],
        activeReleaseByDs,
        scopedType,
        scopedResourceId,
        failedDsIds: new Set([dsReadFailed.id])
      })

      expect(groupsByKey(groups).loadFailed).toEqual([dsReadFailed.id])
    })

    it('never produces loadFailed in non-scoped mode even with failedDsIds', () => {
      const { groups } = classifyDeploymentsForResource({
        deployments: [dsReadFailed],
        activeReleaseByDs,
        scopedType: null,
        scopedResourceId: undefined,
        failedDsIds: [dsReadFailed.id]
      })

      expect(groupsByKey(groups).loadFailed).toEqual([])
    })
  })
})
