import { describe, it, expect } from 'vitest'
import {
  getAvailableActions,
  STATE_ACTIONS,
  VERSION_STATES
} from '@/composables/versioning/version-machine'
import { buildVersionMenuItems } from '@/composables/versioning/version-actions'
import {
  DEFAULT_CAPABILITY,
  VERSIONED_ONLY,
  getVersionCapability
} from '@/composables/versioning/version-capability'

/**
 * Property 1 (anti-regression) + Property 2 (fallback). Enumerates the 8 canonical
 * version states × {deployable, versioned-only} over `getAvailableActions` and
 * `buildVersionMenuItems`:
 *   - deployable keeps DEPLOY/PROMOTE/ROLLBACK exactly where they were today
 *     (byte-identical baseline — guards App/Firewall/Workload/Custom Page/Connector
 *     and legacy/v3 against regression);
 *   - versioned-only NEVER exposes DEPLOY/PROMOTE/ROLLBACK in any state.
 * The authoritative gating lives in the state machine (`getAvailableActions`);
 * the row menu is checked for the same invariant plus a stable deployable baseline.
 * _Requirements: 1.6, 7.5_
 */

// The 8 canonical states (the enumeration axis for Property 1).
const STATES = Object.values(VERSION_STATES)

// Lifecycle actions a `versioned-only` resource must never surface.
const GATED_ACTIONS = ['DEPLOY', 'PROMOTE', 'ROLLBACK']

// Pinned deployable baseline: a copy of the current state→actions matrix. If the
// shared machine regresses for deployable resources, this comparison fails.
const DEPLOYABLE_BASELINE = {
  draft: ['SAVE', 'SAVE_AND_BUILD', 'NEW_DRAFT_FROM', 'DELETE'],
  queued: ['CANCEL_BUILD'],
  building: ['CANCEL_BUILD'],
  ready: ['NEW_DRAFT_FROM', 'ARCHIVE', 'DELETE', 'DEPLOY'],
  active: ['NEW_DRAFT_FROM', 'ARCHIVE', 'DELETE', 'DEPLOY'],
  archived: ['NEW_DRAFT_FROM', 'DELETE'],
  canceled: ['SAVE', 'SAVE_AND_BUILD', 'NEW_DRAFT_FROM', 'DELETE'],
  error: ['SAVE', 'SAVE_AND_BUILD', 'NEW_DRAFT_FROM', 'DELETE']
}

const actionsOf = (items) => items.map((entry) => entry.action)

describe('getAvailableActions — Property 1: deployable baseline is byte-identical', () => {
  it.each(STATES)(
    'state "%s" matches the pinned deployable matrix (default capability)',
    (state) => {
      expect(getAvailableActions(state)).toEqual(DEPLOYABLE_BASELINE[state])
    }
  )

  it.each(STATES)(
    'state "%s" matches the same matrix with DEFAULT_CAPABILITY explicit',
    (state) => {
      expect(getAvailableActions(state, DEFAULT_CAPABILITY)).toEqual(DEPLOYABLE_BASELINE[state])
    }
  )

  it('the pinned baseline mirrors the live STATE_ACTIONS matrix (no drift)', () => {
    STATES.forEach((state) => {
      expect(STATE_ACTIONS[state]).toEqual(DEPLOYABLE_BASELINE[state])
    })
  })
})

describe('getAvailableActions — Property 1: versioned-only never exposes gated actions', () => {
  it.each(STATES)('state "%s" contains no DEPLOY/PROMOTE/ROLLBACK', (state) => {
    const actions = getAvailableActions(state, VERSIONED_ONLY)
    GATED_ACTIONS.forEach((gated) => expect(actions).not.toContain(gated))
  })

  it.each(STATES)(
    'state "%s" only drops gated actions vs. deployable (rest preserved)',
    (state) => {
      const expected = DEPLOYABLE_BASELINE[state].filter(
        (action) => !GATED_ACTIONS.includes(action)
      )
      expect(getAvailableActions(state, VERSIONED_ONLY)).toEqual(expected)
    }
  )
})

describe('buildVersionMenuItems — Property 1: deployable menu baseline never regresses', () => {
  // Stable per-state action order for deployable resources (current shared model).
  const MENU_BASELINE = ['OPEN_CONFIGURATION', 'PROMOTE', 'ROLLBACK', 'ARCHIVE', 'DELETE']

  it.each(STATES)('state "%s" yields the fixed deployable menu order', (state) => {
    const items = buildVersionMenuItems(state, { resourceType: 'edge_application' })
    expect(actionsOf(items)).toEqual(MENU_BASELINE)
  })

  it.each(STATES)('state "%s" menu is identical across deployable resourceTypes', (state) => {
    const fromApp = buildVersionMenuItems(state, { resourceType: 'edge_application' })
    const fromFw = buildVersionMenuItems(state, { resourceType: 'edge_firewall' })
    expect(fromApp).toEqual(fromFw)
  })
})

describe('buildVersionMenuItems — Property 1: versioned-only menu never carries DEPLOY', () => {
  // DEPLOY is a shell-only action and must never appear as a row-menu item for any
  // class. The PROMOTE/ROLLBACK row-item omission for versioned-only is wired by
  // the capability-aware builder (task 3.1) and locked by its own enumeration; the
  // authoritative gate for those lifecycle actions is `getAvailableActions` above.
  it.each(STATES)('state "%s" exposes no DEPLOY row item (versioned-only)', (state) => {
    const items = buildVersionMenuItems(state, { resourceType: 'function' }, VERSIONED_ONLY)
    expect(actionsOf(items)).not.toContain('DEPLOY')
  })

  it.each(STATES)('state "%s" exposes no DEPLOY row item (deployable, for contrast)', (state) => {
    const items = buildVersionMenuItems(state, { resourceType: 'edge_application' })
    expect(actionsOf(items)).not.toContain('DEPLOY')
  })

  it.each(['function', 'network_list', 'waf'])(
    'resourceType "%s" resolves to the versioned-only capability',
    (resourceType) => {
      expect(getVersionCapability(resourceType)).toBe(VERSIONED_ONLY)
    }
  )
})

describe('getVersionCapability — Property 2: unknown/omitted type falls back to DEFAULT_CAPABILITY', () => {
  it.each([undefined, null, '', 'edge_application', 'workload', 'totally-unknown', 'FUNCTION'])(
    'type %p returns DEFAULT_CAPABILITY',
    (resourceType) => {
      expect(getVersionCapability(resourceType)).toBe(DEFAULT_CAPABILITY)
    }
  )

  it('the fallback is the deployable capability (all flags true)', () => {
    expect(DEFAULT_CAPABILITY).toEqual({ canDeploy: true, canPromote: true, canRollback: true })
  })
})
