import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import {
  STATE_ACTIONS,
  VERSION_ACTIONS,
  getAvailableActions,
  isActionAvailable
} from '@/composables/versioning/version-machine'
import { DEFAULT_CAPABILITY, VERSIONED_ONLY } from '@/composables/versioning/version-capability'

/**
 * Spec: versioning-test-coverage — Task 11.1, Property 5 (version-machine).
 *
 * All constants are DERIVED FROM THE REAL MODULE (STATE_ACTIONS, VERSION_ACTIONS)
 * so the properties track the source of truth rather than a hand-copied matrix.
 *
 * Properties (Requirements 2.1 fail-closed + capability gating):
 *   a) result is always a subset of STATE_ACTIONS[state] — never invents an action.
 *   b) VERSIONED_ONLY never yields DEPLOY / PROMOTE / ROLLBACK.
 *   c) any string outside the declared states returns [] (fail-closed) — the
 *      unknown-state generator deliberately includes prototype-chain keys
 *      ('toString', 'constructor', 'hasOwnProperty', …) which the naive lookup
 *      resolved through the prototype (the bug this task fixed).
 *   d) isActionAvailable(state, action, cap) === getAvailableActions(...).includes(action).
 *   e) any capability with canDeploy=true reproduces the DEFAULT_CAPABILITY output
 *      exactly (no regression of the default for non-gated actions).
 */

const NUM_RUNS = 200

const KNOWN_STATES = Object.keys(STATE_ACTIONS)
const GATED_ACTIONS = ['DEPLOY', 'PROMOTE', 'ROLLBACK']

// Prototype-chain keys: none is a declared state, yet a naive `STATE_ACTIONS[key]`
// resolves them to inherited members (functions/objects) instead of undefined.
const PROTOTYPE_KEYS = [
  'toString',
  'valueOf',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'constructor',
  '__proto__',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__'
]

const knownStateArb = fc.constantFrom(...KNOWN_STATES)

// Honest unknown-state generator: arbitrary strings that are NOT declared states,
// with the prototype-chain keys forced in so the fail-closed contract is exercised
// against exactly the inputs that used to throw.
const unknownStateArb = fc.oneof(
  fc.constantFrom(...PROTOTYPE_KEYS),
  fc.string().filter((candidate) => !KNOWN_STATES.includes(candidate))
)

const capabilityArb = fc.oneof(
  fc.constant(DEFAULT_CAPABILITY),
  fc.constant(VERSIONED_ONLY),
  fc.record({
    canDeploy: fc.boolean(),
    canPromote: fc.boolean(),
    canRollback: fc.boolean()
  })
)

const actionArb = fc.constantFrom(
  ...Object.values(VERSION_ACTIONS),
  'PROMOTE',
  'ROLLBACK',
  'NOT_A_REAL_ACTION'
)

describe('version-machine getAvailableActions — property-based (Property 5)', () => {
  it('a) never invents an action: result ⊆ STATE_ACTIONS[state] for any capability', () => {
    fc.assert(
      fc.property(knownStateArb, capabilityArb, (state, capability) => {
        const allowed = STATE_ACTIONS[state]
        const result = getAvailableActions(state, capability)
        expect(result.every((action) => allowed.includes(action))).toBe(true)
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('b) VERSIONED_ONLY never yields DEPLOY / PROMOTE / ROLLBACK in any state', () => {
    fc.assert(
      fc.property(knownStateArb, (state) => {
        const result = getAvailableActions(state, VERSIONED_ONLY)
        expect(result.some((action) => GATED_ACTIONS.includes(action))).toBe(false)
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('c) fail-closed: any string outside declared states returns [] (incl. prototype keys)', () => {
    fc.assert(
      fc.property(unknownStateArb, capabilityArb, (state, capability) => {
        expect(getAvailableActions(state, capability)).toEqual([])
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('d) isActionAvailable is coherent with getAvailableActions for any state/action/capability', () => {
    fc.assert(
      fc.property(
        fc.oneof(knownStateArb, unknownStateArb),
        actionArb,
        capabilityArb,
        (state, action, capability) => {
          const expected = getAvailableActions(state, capability).includes(action)
          expect(isActionAvailable(state, action, capability)).toBe(expected)
        }
      ),
      { numRuns: NUM_RUNS }
    )
  })

  it('e) canDeploy=true reproduces the DEFAULT_CAPABILITY output exactly (no default regression)', () => {
    const deployableArb = fc.record({
      canDeploy: fc.constant(true),
      canPromote: fc.boolean(),
      canRollback: fc.boolean()
    })
    fc.assert(
      fc.property(knownStateArb, deployableArb, (state, capability) => {
        expect(getAvailableActions(state, capability)).toEqual(
          getAvailableActions(state, DEFAULT_CAPABILITY)
        )
      }),
      { numRuns: NUM_RUNS }
    )
  })
})
