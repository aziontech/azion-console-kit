import { describe, it, expect } from 'vitest'
import { classifyDeploymentsForResource } from '@/templates/release-composition/classify-deployments-for-resource'

const GROUP_LABELS = {
  linked: 'Already using this resource',
  available: 'Available — not linked yet'
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
        'Available — not linked yet'
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
        'Available — not linked yet'
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
})
