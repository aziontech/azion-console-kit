import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { createVersionAdapter } from '@/services/v2/versioning/version-adapter'
import { VERSION_STATES } from '@/composables/versioning/version-machine'

/**
 * Spec: versioning-test-coverage — Task 11.2, Property 6 (version-adapter).
 *
 * Uses ONE test adapter built from the real factory:
 *   - normalizeConfig: pass-through of the known config fields (settings, rules).
 *   - mapResourceFields: identity over the arbitrary body.
 *
 * Properties assert the REAL source behavior — notably that `stripUndefinedDeep`
 * treats arrays as OPAQUE LEAVES (it never recurses into them), so undefined is
 * only stripped from object-property positions while arrays are preserved verbatim.
 *
 *   a) transformDraftPayload strips undefined from every object-property depth;
 *      null and arrays pass through exactly.
 *   b) source_version / comment sit at the ROOT when defined, absent when undefined.
 *   c) normalizeVersion: id = version_id, state preserved, config = normalizeConfig(raw),
 *      and meta.* takes precedence over the flat keys when both are present.
 *   d) transformListVersions: count is honored, body.length === results.length,
 *      and the {results,count} envelope is equivalent to the bare array form.
 */

const NUM_RUNS = 200

const passthroughConfig = (raw) => ({ settings: raw?.settings, rules: raw?.rules })
const identityFields = (body) => body

const adapter = createVersionAdapter({
  normalizeConfig: passthroughConfig,
  mapResourceFields: identityFields
})

const stateArb = fc.constantFrom(...Object.values(VERSION_STATES))

// Keys that carry special adapter meaning; excluded from arbitrary noise so each
// property isolates the behavior under test.
const RESERVED_KEYS = [
  'version_id',
  'id',
  'meta',
  'version_state',
  'state',
  'version',
  'description',
  'comment',
  'source_version_id',
  'sourceVersionId',
  'source_version',
  'created_at',
  'ready_at',
  'last_modified',
  'last_editor',
  'reference_count',
  'settings',
  'rules'
]

const safeKeyArb = fc.string().filter((key) => !RESERVED_KEYS.includes(key))

const containsUndefinedDeep = (value) => {
  if (value === undefined) return true
  if (value === null || typeof value !== 'object') return false
  if (Array.isArray(value)) return value.some(containsUndefinedDeep)
  return Object.values(value).some(containsUndefinedDeep)
}

// A node that never contains `undefined` anywhere — used for array contents so
// arrays remain clean (the adapter preserves them opaquely, undefined and all).
const cleanLeafArb = fc.oneof(fc.integer(), fc.string(), fc.boolean(), fc.constant(null))
const { cleanNode } = fc.letrec((tie) => ({
  cleanNode: fc.oneof(
    cleanLeafArb,
    fc.array(tie('cleanNode'), { maxLength: 4 }),
    fc.dictionary(safeKeyArb, tie('cleanNode'), { maxKeys: 4 })
  )
}))

// A node whose object-property positions MAY be undefined (to exercise stripping),
// while its arrays only ever hold clean nodes.
const { strippableNode } = fc.letrec((tie) => ({
  strippableNode: fc.oneof(
    fc.oneof(cleanLeafArb, fc.constant(undefined)),
    fc.array(cleanNode, { maxLength: 4 }),
    fc.dictionary(safeKeyArb, tie('strippableNode'), { maxKeys: 4 })
  )
}))

const strippableObjArb = fc.dictionary(safeKeyArb, strippableNode, { maxKeys: 6 })

const optionalString = fc.option(fc.string(), { nil: undefined })

describe('version-adapter — property-based (Property 6)', () => {
  it('a) transformDraftPayload strips undefined at every object depth; null/arrays preserved', () => {
    fc.assert(
      fc.property(strippableObjArb, fc.array(cleanNode, { maxLength: 5 }), (body, keptArray) => {
        const input = { ...body, keptArray, keptNull: null }
        const payload = adapter.transformDraftPayload(input)
        expect(containsUndefinedDeep(payload)).toBe(false)
        expect(payload.keptArray).toEqual(keptArray)
        expect(payload.keptNull).toBe(null)
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('b) transformDraftPayload puts source_version/comment at the root, absent when undefined', () => {
    fc.assert(
      fc.property(optionalString, optionalString, (comment, sourceVersionId) => {
        const payload = adapter.transformDraftPayload({ comment, sourceVersionId })
        if (comment === undefined) {
          expect(Object.prototype.hasOwnProperty.call(payload, 'comment')).toBe(false)
        } else {
          expect(payload.comment).toBe(comment)
        }
        if (sourceVersionId === undefined) {
          expect(Object.prototype.hasOwnProperty.call(payload, 'source_version')).toBe(false)
        } else {
          expect(payload.source_version).toBe(sourceVersionId)
        }
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('c) normalizeVersion: id=version_id, state preserved, config=normalizeConfig(raw)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        stateArb,
        optionalString,
        fc.option(fc.array(fc.string(), { maxLength: 4 }), { nil: undefined }),
        fc.dictionary(safeKeyArb, cleanLeafArb, { maxKeys: 4 }),
        (versionId, state, settings, rules, extras) => {
          const raw = { version_id: versionId, state, settings, rules, ...extras }
          const normalized = adapter.normalizeVersion(raw)
          expect(normalized.id).toBe(versionId)
          expect(normalized.state).toBe(state)
          expect(normalized.config).toEqual({ settings, rules })
        }
      ),
      { numRuns: NUM_RUNS }
    )
  })

  it('c) normalizeVersion: meta.* takes precedence over the flat keys when both present', () => {
    const distinctStates = fc
      .tuple(stateArb, stateArb)
      .filter(([metaState, flatState]) => metaState !== flatState)
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        distinctStates,
        (metaSuffix, flatSuffix, [metaState, flatState]) => {
          const metaId = `meta-${metaSuffix}`
          const flatId = `flat-${flatSuffix}`
          const raw = {
            version_id: flatId,
            state: flatState,
            meta: { version_id: metaId, version_state: metaState }
          }
          const normalized = adapter.normalizeVersion(raw)
          expect(normalized.id).toBe(metaId)
          expect(normalized.state).toBe(metaState)
        }
      ),
      { numRuns: NUM_RUNS }
    )
  })

  it('d) transformListVersions: count honored, body.length === results.length, envelope≡array', () => {
    const snapshotArb = fc.record({
      version_id: fc.string({ minLength: 1 }),
      state: stateArb
    })
    fc.assert(
      fc.property(
        fc.array(snapshotArb, { maxLength: 20 }),
        fc.nat(),
        (snapshots, providedCount) => {
          const envelope = adapter.transformListVersions({
            results: snapshots,
            count: providedCount
          })
          expect(envelope.count).toBe(providedCount)
          expect(envelope.body.length).toBe(snapshots.length)

          const fromArray = adapter.transformListVersions(snapshots)
          expect(fromArray.count).toBe(snapshots.length)
          expect(fromArray.body.length).toBe(snapshots.length)

          const envelopeNoCount = adapter.transformListVersions({ results: snapshots })
          expect(envelopeNoCount).toEqual(fromArray)
        }
      ),
      { numRuns: NUM_RUNS }
    )
  })
})
