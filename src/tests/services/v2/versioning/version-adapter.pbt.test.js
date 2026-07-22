import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { createVersionAdapter } from '@/services/v2/versioning/version-adapter'
import { VERSION_STATES } from '@/composables/versioning/version-machine'

const NUM_RUNS = 200

const passthroughConfig = (raw) => ({ settings: raw?.settings, rules: raw?.rules })
const identityFields = (body) => body

const adapter = createVersionAdapter({
  normalizeConfig: passthroughConfig,
  mapResourceFields: identityFields
})

const stateArb = fc.constantFrom(...Object.values(VERSION_STATES))

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

const cleanLeafArb = fc.oneof(fc.integer(), fc.string(), fc.boolean(), fc.constant(null))

const dirtyLeafArb = fc.oneof(cleanLeafArb, fc.constant(undefined))
const { dirtyNode } = fc.letrec((tie) => ({
  dirtyNode: fc.oneof(
    dirtyLeafArb,
    fc.array(tie('dirtyNode'), { maxLength: 4 }),
    fc.dictionary(safeKeyArb, tie('dirtyNode'), { maxKeys: 4 })
  )
}))

const dirtyObjArb = fc.dictionary(safeKeyArb, dirtyNode, { maxKeys: 6 })

const referenceClean = (value) => {
  if (value === undefined) return undefined
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) {
    const out = []
    for (const item of value) {
      const cleaned = referenceClean(item)
      if (cleaned !== undefined) out.push(cleaned)
    }
    return out
  }
  const out = {}
  for (const key of Object.keys(value)) {
    const cleaned = referenceClean(value[key])
    if (cleaned !== undefined) out[key] = cleaned
  }
  return Object.keys(out).length > 0 ? out : undefined
}

const optionalString = fc.option(fc.string(), { nil: undefined })

describe('version-adapter — property-based (Property 6)', () => {
  it('a) transformDraftPayload strips undefined at EVERY depth incl. inside arrays; null/array structure preserved', () => {
    fc.assert(
      fc.property(dirtyObjArb, (body) => {
        const input = {
          ...body,
          keptNull: null,
          keptNulls: [null, null],
          dirtyArray: [1, undefined, null, { keep: 7, gone: undefined }],
          emptyAfterStrip: [undefined, undefined]
        }
        const payload = adapter.transformDraftPayload(input)

        expect(containsUndefinedDeep(payload)).toBe(false)
        expect(payload.keptNull).toBe(null)
        expect(payload.keptNulls).toEqual([null, null])
        expect(payload.dirtyArray).toEqual([1, null, { keep: 7 }])
        expect(payload.emptyAfterStrip).toEqual([])
        expect(payload).toEqual(referenceClean(input))
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
