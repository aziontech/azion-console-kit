import { describe, it, expect } from 'vitest'
import { buildVersionMenuItems } from '@/composables/versioning/version-actions'
import { VERSION_STATES } from '@/composables/versioning/version-machine'
import { VERSIONED_ONLY, getVersionCapability } from '@/composables/versioning/version-capability'

const VERSIONED_ONLY_ORDER = ['OPEN_CONFIGURATION', 'BUILD', 'NEW_DRAFT_FROM', 'ARCHIVE', 'DELETE']
const DEPLOYABLE_ORDER = [
  'OPEN_CONFIGURATION',
  'BUILD',
  'DEPLOY',
  'PROMOTE',
  'ROLLBACK',
  'ARCHIVE',
  'DELETE'
]

const STATES_WITH_DELETE = Object.values(VERSION_STATES)
const VERSIONED_ONLY_TYPES = ['function', 'network_list', 'waf']

const actionsOf = (items) => items.map((entry) => entry.action)
const byAction = (items, action) => items.find((entry) => entry.action === action)

describe('buildVersionMenuItems — versioned-only kebab (Req 2.2)', () => {
  it.each(STATES_WITH_DELETE)(
    'state "%s" omits PROMOTE and ROLLBACK for versioned-only',
    (state) => {
      const items = buildVersionMenuItems(state, {}, VERSIONED_ONLY)
      expect(byAction(items, 'PROMOTE')).toBeUndefined()
      expect(byAction(items, 'ROLLBACK')).toBeUndefined()
    }
  )

  it.each(STATES_WITH_DELETE)('state "%s" yields the fixed versioned-only order', (state) => {
    const items = buildVersionMenuItems(state, {}, VERSIONED_ONLY)
    expect(actionsOf(items)).toEqual(VERSIONED_ONLY_ORDER)
  })

  it('omits ONLY Delete when the version is already deleted (versioned-only)', () => {
    const items = buildVersionMenuItems('deleted', {}, VERSIONED_ONLY)
    expect(actionsOf(items)).toEqual(['OPEN_CONFIGURATION', 'BUILD', 'NEW_DRAFT_FROM', 'ARCHIVE'])
  })
})

describe('buildVersionMenuItems — "New version from this" override (Req 2.3)', () => {
  it.each(STATES_WITH_DELETE)(
    'inserts NEW_DRAFT_FROM labeled "New version from this" (state "%s")',
    (state) => {
      const newDraft = byAction(buildVersionMenuItems(state, {}, VERSIONED_ONLY), 'NEW_DRAFT_FROM')
      expect(newDraft).toBeDefined()
      expect(newDraft.label).toBe('New version from this')
    }
  )

  it('does NOT mutate ACTION_META — deployable NEW_DRAFT_FROM keeps "Clone as Draft"', () => {
    buildVersionMenuItems(VERSION_STATES.READY, {}, VERSIONED_ONLY)
    const deployable = buildVersionMenuItems(VERSION_STATES.READY)
    expect(byAction(deployable, 'NEW_DRAFT_FROM')).toBeUndefined()
  })
})

describe('buildVersionMenuItems — capability resolved from resourceType', () => {
  it.each(VERSIONED_ONLY_TYPES)(
    'resourceType "%s" resolves to the versioned-only menu without an explicit capability',
    (resourceType) => {
      const items = buildVersionMenuItems(VERSION_STATES.READY, { resourceType })
      expect(actionsOf(items)).toEqual(VERSIONED_ONLY_ORDER)
      expect(getVersionCapability(resourceType)).toBe(VERSIONED_ONLY)
    }
  )
})

describe('buildVersionMenuItems — deployable default keeps the full lifecycle order', () => {
  it.each(STATES_WITH_DELETE)('state "%s" keeps the 7-item deployable order', (state) => {
    const items = buildVersionMenuItems(state, { resourceType: 'edge_application' })
    expect(actionsOf(items)).toEqual(DEPLOYABLE_ORDER)
    expect(byAction(items, 'BUILD')).toBeDefined()
    expect(byAction(items, 'DEPLOY')).toBeDefined()
    expect(byAction(items, 'PROMOTE')).toBeDefined()
    expect(byAction(items, 'ROLLBACK')).toBeDefined()
    expect(byAction(items, 'NEW_DRAFT_FROM')).toBeUndefined()
  })
})
