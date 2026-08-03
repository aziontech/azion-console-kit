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
 * @param {object} descriptor
 */
export const describeCapabilitySurfaces = (descriptor) => {
  const STATES = Object.values(VERSION_STATES)
  const GATED = ['DEPLOY', 'PROMOTE', 'ROLLBACK']

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
