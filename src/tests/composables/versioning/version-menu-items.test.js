import { describe, it, expect } from 'vitest'
import { buildVersionMenuItems } from '@/composables/versioning/version-actions'
import { VERSION_STATES } from '@/composables/versioning/version-machine'

/**
 * Properties P1–P4 of the shared version row-menu model (task 1.3).
 * `buildVersionMenuItems(state, ctx)` is the single source of the 5 fixed items;
 * these tests enumerate every VersionState × a few resourceTypes to lock its
 * set+order (P1), never-hide rule (P2), enablement matrix (P3) and purity (P4).
 */

const FIXED_ORDER = ['OPEN_CONFIGURATION', 'PROMOTE', 'ROLLBACK', 'ARCHIVE', 'DELETE']
const ORDER_WITHOUT_DELETE = FIXED_ORDER.slice(0, -1)

// Canonical states + the synthetic `deleted` (Delete omitted) and an unknown state.
const ALL_STATES = [...Object.values(VERSION_STATES), 'deleted', 'totally-unknown']

// resourceType is purely contextual: the model must not branch on it.
const RESOURCE_TYPES = ['edge_application', 'edge_firewall', 'edge_connector', 'custom_pages']

// Expected enablement per state, derived from the spec matrix (P3).
const PROMOTE_ENABLED_STATES = [VERSION_STATES.READY]
const ARCHIVE_ENABLED_STATES = [VERSION_STATES.READY, VERSION_STATES.ERROR, VERSION_STATES.CANCELED]

const actionsOf = (items) => items.map((entry) => entry.action)
const byAction = (items, action) => items.find((entry) => entry.action === action)

describe('buildVersionMenuItems — P1: same set + order regardless of resourceType', () => {
  it.each(ALL_STATES)('state "%s" yields the fixed order across resourceTypes', (state) => {
    const expectedOrder = state === 'deleted' ? ORDER_WITHOUT_DELETE : FIXED_ORDER

    RESOURCE_TYPES.forEach((resourceType) => {
      const items = buildVersionMenuItems(state, { resourceType })
      expect(actionsOf(items)).toEqual(expectedOrder)
    })
  })

  it('produces an identical item set for two different resourceTypes (same state)', () => {
    const fromApp = buildVersionMenuItems(VERSION_STATES.READY, {
      resourceType: 'edge_application'
    })
    const fromFw = buildVersionMenuItems(VERSION_STATES.READY, { resourceType: 'edge_firewall' })
    expect(fromApp).toEqual(fromFw)
  })
})

describe('buildVersionMenuItems — P2: never hide (items present, disabled not absent)', () => {
  it.each(ALL_STATES.filter((state) => state !== 'deleted'))(
    'state "%s" keeps all 5 items present',
    (state) => {
      const items = buildVersionMenuItems(state)
      expect(items).toHaveLength(5)
      expect(actionsOf(items)).toEqual(FIXED_ORDER)
    }
  )

  it('omits ONLY Delete when the version is already deleted', () => {
    const items = buildVersionMenuItems('deleted')
    expect(items).toHaveLength(4)
    expect(actionsOf(items)).toEqual(ORDER_WITHOUT_DELETE)
    expect(byAction(items, 'DELETE')).toBeUndefined()
  })

  it.each(ALL_STATES)('unavailable actions are disabled, never removed (state "%s")', (state) => {
    const items = buildVersionMenuItems(state)
    // Every present item must carry a boolean `disabled` flag (never silently dropped).
    items.forEach((entry) => expect(typeof entry.disabled).toBe('boolean'))
    // Promote/Archive/Open/Rollback always stay present regardless of state.
    ;['OPEN_CONFIGURATION', 'PROMOTE', 'ROLLBACK', 'ARCHIVE'].forEach((action) => {
      expect(byAction(items, action)).toBeDefined()
    })
  })
})

describe('buildVersionMenuItems — P3: enablement matrix', () => {
  it.each(ALL_STATES)('Open configuration is always enabled (state "%s")', (state) => {
    expect(byAction(buildVersionMenuItems(state), 'OPEN_CONFIGURATION').disabled).toBe(false)
  })

  it.each(ALL_STATES)('Rollback is always disabled with a tooltip (state "%s")', (state) => {
    const rollback = byAction(buildVersionMenuItems(state), 'ROLLBACK')
    expect(rollback.disabled).toBe(true)
    expect(rollback.tooltip).toBeTruthy()
  })

  it.each(ALL_STATES)('Promote is enabled iff the state is ready (state "%s")', (state) => {
    const expectedEnabled = PROMOTE_ENABLED_STATES.includes(state)
    const promote = byAction(buildVersionMenuItems(state), 'PROMOTE')
    expect(promote.disabled).toBe(!expectedEnabled)
    if (!expectedEnabled) expect(promote.tooltip).toBeTruthy()
  })

  it.each(ALL_STATES)(
    'Archive is enabled iff state ∈ {ready, error, canceled} (state "%s")',
    (state) => {
      const expectedEnabled = ARCHIVE_ENABLED_STATES.includes(state)
      const archive = byAction(buildVersionMenuItems(state), 'ARCHIVE')
      expect(archive.disabled).toBe(!expectedEnabled)
    }
  )

  it.each(ALL_STATES)(
    'Delete is present (enabled) iff state is not deleted (state "%s")',
    (state) => {
      const deleteItem = byAction(buildVersionMenuItems(state), 'DELETE')
      if (state === 'deleted') {
        expect(deleteItem).toBeUndefined()
      } else {
        expect(deleteItem).toBeDefined()
        expect(deleteItem.disabled).toBe(false)
        expect(deleteItem.danger).toBe(true)
        expect(deleteItem.separatorBefore).toBe(true)
      }
    }
  )
})

describe('buildVersionMenuItems — P4: purity (same input → same output, no side effects)', () => {
  it.each(ALL_STATES)('returns deep-equal output for repeated calls (state "%s")', (state) => {
    const first = buildVersionMenuItems(state, { resourceType: 'edge_application' })
    const second = buildVersionMenuItems(state, { resourceType: 'edge_application' })
    expect(first).toEqual(second)
  })

  it('does not mutate the ctx argument', () => {
    const ctx = { resourceType: 'edge_application', resourceId: 42 }
    const snapshot = JSON.stringify(ctx)
    buildVersionMenuItems(VERSION_STATES.READY, ctx)
    expect(JSON.stringify(ctx)).toBe(snapshot)
  })

  it('returns a fresh array each call (no shared mutable reference)', () => {
    const first = buildVersionMenuItems(VERSION_STATES.READY)
    const second = buildVersionMenuItems(VERSION_STATES.READY)
    expect(first).not.toBe(second)
    first[0].label = 'mutated'
    expect(second[0].label).not.toBe('mutated')
  })
})
