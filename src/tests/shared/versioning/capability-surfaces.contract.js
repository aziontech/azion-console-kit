import { describe, expect, it } from 'vitest'
import {
  getVersionBarActions,
  buildVersionMenuItems
} from '@/composables/versioning/version-actions'
import { getAvailableActions, VERSION_STATES } from '@/composables/versioning/version-machine'
import {
  DEFAULT_CAPABILITY,
  VERSIONED_ONLY,
  getVersionCapability
} from '@/composables/versioning/version-capability'

/**
 * Shared behavioral contract for the version CAPABILITY SURFACES — the three
 * pure functions that gate lifecycle affordances by resource class:
 *   - `getAvailableActions` (the authoritative state→actions matrix, capability-filtered),
 *   - `getVersionBarActions` (the footer / heading action-bar buttons),
 *   - `buildVersionMenuItems` (the per-row kebab menu).
 *
 * Every resource declares a `capabilityClass` ('deployable' | 'versioned-only')
 * in the test registry. This suite proves — per class, across ALL 8 canonical
 * states — that the surfaces expose (deployable) or withhold (versioned-only)
 * Deploy/Promote/Rollback exactly as the source dictates. Expectations are
 * DERIVED from the real source (`version-actions.js` / `version-machine.js` /
 * `version-capability.js`), not from a duplicated matrix.
 *
 * @param {object} descriptor resource descriptor from `RESOURCE_TEST_REGISTRY`
 */
export const describeCapabilitySurfaces = (descriptor) => {
  const STATES = Object.values(VERSION_STATES)
  const GATED = ['DEPLOY', 'PROMOTE', 'ROLLBACK']

  // Fixed menu action order, read straight from `buildVersionMenuItems`:
  //   deployable →   OPEN_CONFIGURATION, BUILD, DEPLOY, PROMOTE, ROLLBACK, ARCHIVE, DELETE
  //   versioned-only OPEN_CONFIGURATION, BUILD, NEW_DRAFT_FROM, ARCHIVE, DELETE
  // (ARCHIVE stays via never-hide; DELETE is present for every non-'deleted' state.)
  const DEPLOYABLE_MENU = [
    'OPEN_CONFIGURATION',
    'BUILD',
    'DEPLOY',
    'PROMOTE',
    'ROLLBACK',
    'ARCHIVE',
    'DELETE'
  ]
  const VERSIONED_ONLY_MENU = ['OPEN_CONFIGURATION', 'BUILD', 'NEW_DRAFT_FROM', 'ARCHIVE', 'DELETE']
  const VERSIONED_ONLY_NEW_DRAFT_LABEL = 'New version from this'

  const isVersionedOnly = descriptor.capabilityClass === 'versioned-only'
  const ctx = { resourceType: descriptor.resourceType }
  const actionsOf = (items) => items.map((entry) => entry.action)
  const barKeys = (actions) => actions.map((action) => action.key)

  describe(`capability surfaces: ${descriptor.resourceType} (${descriptor.capabilityClass})`, () => {
    it('resolves to the capability the class declares (registry ↔ source integrity)', () => {
      const resolved = getVersionCapability(descriptor.resourceType)
      expect(resolved).toBe(isVersionedOnly ? VERSIONED_ONLY : DEFAULT_CAPABILITY)
    })

    describe('getAvailableActions', () => {
      const capability = getVersionCapability(descriptor.resourceType)

      if (isVersionedOnly) {
        it.each(STATES)('state "%s" never exposes DEPLOY/PROMOTE/ROLLBACK', (state) => {
          const actions = getAvailableActions(state, capability)
          GATED.forEach((gated) => expect(actions).not.toContain(gated))
        })
      } else {
        it.each([VERSION_STATES.READY, VERSION_STATES.ACTIVE])(
          'built state "%s" exposes DEPLOY',
          (state) => {
            expect(getAvailableActions(state, capability)).toContain('DEPLOY')
          }
        )
      }
    })

    describe('getVersionBarActions', () => {
      const capability = getVersionCapability(descriptor.resourceType)

      if (isVersionedOnly) {
        it('drops DEPLOY from the ready and active action bars', () => {
          expect(barKeys(getVersionBarActions('ready', capability))).not.toContain('DEPLOY')
          expect(barKeys(getVersionBarActions('active', capability))).not.toContain('DEPLOY')
        })
      } else {
        it('keeps Deploy on ready and Redeploy on active', () => {
          const ready = getVersionBarActions('ready', capability)
          const active = getVersionBarActions('active', capability)
          expect(ready).toContainEqual(expect.objectContaining({ key: 'DEPLOY', label: 'Deploy' }))
          expect(active).toContainEqual(
            expect.objectContaining({ key: 'DEPLOY', label: 'Redeploy' })
          )
        })
      }
    })

    describe('buildVersionMenuItems', () => {
      const capability = getVersionCapability(descriptor.resourceType)
      const expectedMenu = isVersionedOnly ? VERSIONED_ONLY_MENU : DEPLOYABLE_MENU

      it.each(STATES)('state "%s" yields the fixed menu order for the class', (state) => {
        const items = buildVersionMenuItems(state, ctx, capability)
        expect(actionsOf(items)).toEqual(expectedMenu)
      })

      if (isVersionedOnly) {
        it.each(STATES)('state "%s" labels the draft-fork "New version from this"', (state) => {
          const items = buildVersionMenuItems(state, ctx, capability)
          const newDraft = items.find((entry) => entry.action === 'NEW_DRAFT_FROM')
          expect(newDraft?.label).toBe(VERSIONED_ONLY_NEW_DRAFT_LABEL)
        })
      }
    })
  })
}
