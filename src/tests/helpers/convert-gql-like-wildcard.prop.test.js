import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { convertGQL } from '@/helpers/convert-gql'

/**
 * Spec: realtime-events-multiple-bugs — Bug 1 (Like/Ilike wildcard handling).
 *
 * Validates: Requirements 1.* (Like/Ilike operator preserves user-supplied
 * `%` wildcards byte-for-byte instead of unconditionally wrapping with `%`).
 *
 * GOAL — exercise `convertGQL` directly for the three relevant invariants
 * that the fix must satisfy:
 *
 *   PBT 1.A (passthrough): when the user value already contains a `%`, the
 *     emitted GraphQL variable binding MUST equal the user value byte-for-
 *     byte (no extra `%` prepended/appended).
 *
 *   PBT 1.B (wrap when no `%`): when the user value does NOT contain a `%`,
 *     today's behaviour wraps with `%` on both sides — this preserves
 *     backwards compatibility (`Contains <value>`).
 *
 *   PBT 1.C (non-Like operators are unaffected): for operators outside the
 *     Like/Ilike family (Eq, Ne, In, Range, Lt, Lte, Gt, Gte), the value is
 *     forwarded byte-for-byte regardless of whether it contains a `%`.
 *
 * EXPECTED OUTCOME on UNFIXED code:
 *   - PBT 1.A → FAILS. `formatValueContainOperator` (convert-gql.js L98–105)
 *     unconditionally prepends and appends `%`, so `app%` becomes `%app%%`.
 *   - PBT 1.B → PASSES. No `%` in the user value, so today's wrapping is
 *     correct (`api` → `%api%`).
 *   - PBT 1.C → PASSES. Non-Like operators never enter the wrapper branch.
 */

const fixturesTable = {
  fields: ['host', 'status', 'requestUri'],
  dataset: 'httpEvents',
  limit: 10,
  orderBy: 'ts'
}

const SEED = 20240517
const NUM_RUNS = 100

// ── Generators ─────────────────────────────────────────────────────────

const arbField = fc.constantFrom('host', 'status', 'requestUri')
const arbLikeOperator = fc.constantFrom('Like', 'Ilike')
const arbNonLikeOperator = fc.constantFrom('Eq', 'Ne', 'In', 'Range', 'Lt', 'Lte', 'Gt', 'Gte')

const arbValueWithPercent = fc
  .string({ minLength: 1, maxLength: 16 })
  .filter((s) => s.includes('%'))

const arbValueWithoutPercent = fc
  .string({ minLength: 1, maxLength: 16 })
  .filter((s) => !s.includes('%') && s.trim().length > 0)

const variableKey = (field, operator) => `and_${field}${operator}`

// ── PBT 1.A — passthrough when value already contains `%` ─────────────

describe('convertGQL Like/Ilike passthrough (PBT 1.A) — MUST FAIL on unfixed code', () => {
  it('deterministic case: value `app%` flows through Like as `app%` (no extra wrapping)', () => {
    const filter = {
      fields: [{ valueField: 'host', operator: 'Like', value: 'app%' }]
    }
    const result = convertGQL(filter, fixturesTable)
    expect(result.variables.and_hostLike).toBe('app%')
  })

  it('deterministic case: value `%app` flows through Like as `%app` (no extra wrapping)', () => {
    const filter = {
      fields: [{ valueField: 'host', operator: 'Like', value: '%app' }]
    }
    const result = convertGQL(filter, fixturesTable)
    expect(result.variables.and_hostLike).toBe('%app')
  })

  it('deterministic case: value `%api%` flows through Like as `%api%` (no extra wrapping)', () => {
    const filter = {
      fields: [{ valueField: 'host', operator: 'Like', value: '%api%' }]
    }
    const result = convertGQL(filter, fixturesTable)
    expect(result.variables.and_hostLike).toBe('%api%')
  })

  it('property: for any (field, Like|Ilike, valueWithPercent) the emitted variable equals the value byte-for-byte', () => {
    fc.assert(
      fc.property(arbField, arbLikeOperator, arbValueWithPercent, (field, operator, value) => {
        const filter = {
          fields: [{ valueField: field, operator, value }]
        }
        const result = convertGQL(filter, fixturesTable)
        const key = variableKey(field, operator)
        expect(result.variables[key]).toBe(value)
      }),
      { seed: SEED, numRuns: NUM_RUNS }
    )
  })
})

// ── PBT 1.B — wrap when value has no `%` ──────────────────────────────

describe('convertGQL Like/Ilike wrap when no `%` (PBT 1.B) — MUST PASS', () => {
  it('deterministic case: value `api` flows through Like as `%api%`', () => {
    const filter = {
      fields: [{ valueField: 'host', operator: 'Like', value: 'api' }]
    }
    const result = convertGQL(filter, fixturesTable)
    expect(result.variables.and_hostLike).toBe('%api%')
  })

  it('deterministic case: value `test` flows through Ilike as `%test%`', () => {
    const filter = {
      fields: [{ valueField: 'host', operator: 'Ilike', value: 'test' }]
    }
    const result = convertGQL(filter, fixturesTable)
    // Ilike emits inside `not: { hostLike: $... }`; the variable key is still
    // `and_hostIlike`. We assert on the variable binding only.
    expect(result.variables.and_hostIlike).toBe('%test%')
  })

  it('property: for any (field, Like|Ilike, valueWithoutPercent) the emitted variable equals `%` + value + `%`', () => {
    fc.assert(
      fc.property(arbField, arbLikeOperator, arbValueWithoutPercent, (field, operator, value) => {
        const filter = {
          fields: [{ valueField: field, operator, value }]
        }
        const result = convertGQL(filter, fixturesTable)
        const key = variableKey(field, operator)
        expect(result.variables[key]).toBe(`%${value}%`)
      }),
      { seed: SEED, numRuns: NUM_RUNS }
    )
  })
})

// ── PBT 1.C — non-Like operators forward value byte-for-byte ──────────

describe('convertGQL non-Like operators forward value byte-for-byte (PBT 1.C) — MUST PASS', () => {
  // Non-Like, non-Range, non-In operators all go through the same
  // `and_${field}${operator}` slot. Range/In are special-cased and asserted
  // separately.
  const SIMPLE_NON_LIKE_OPS = ['Eq', 'Ne', 'Lt', 'Lte', 'Gt', 'Gte']

  it('deterministic case: Eq with value containing `%` is forwarded unchanged', () => {
    const filter = {
      fields: [{ valueField: 'host', operator: 'Eq', value: 'foo%bar' }]
    }
    const result = convertGQL(filter, fixturesTable)
    expect(result.variables.and_hostEq).toBe('foo%bar')
  })

  it('deterministic case: In with array value forwards each entry unchanged (even if entry has `%`)', () => {
    const filter = {
      fields: [
        {
          valueField: 'host',
          operator: 'In',
          value: [
            { value: 'foo%', label: 'foo%' },
            { value: 'bar', label: 'bar' }
          ]
        }
      ]
    }
    const result = convertGQL(filter, fixturesTable)
    expect(result.variables.in_hostIn).toEqual(['foo%', 'bar'])
  })

  it('deterministic case: Range value is forwarded byte-for-byte (begin/end strings preserved)', () => {
    const filter = {
      fields: [
        {
          valueField: 'requestUri',
          operator: 'Range',
          value: { begin: '10%', end: '90%' }
        }
      ]
    }
    const result = convertGQL(filter, fixturesTable)
    expect(result.variables.requestUriRange_begin).toBe('10%')
    expect(result.variables.requestUriRange_end).toBe('90%')
  })

  it('property: for any (field, simpleNonLikeOp, value) — with or without `%` — the value is forwarded byte-for-byte', () => {
    const arbAnyValue = fc.oneof(arbValueWithPercent, arbValueWithoutPercent)
    fc.assert(
      fc.property(
        arbField,
        fc.constantFrom(...SIMPLE_NON_LIKE_OPS),
        arbAnyValue,
        (field, operator, value) => {
          const filter = {
            fields: [{ valueField: field, operator, value }]
          }
          const result = convertGQL(filter, fixturesTable)
          const key = `and_${field}${operator}`
          expect(result.variables[key]).toBe(value)
        }
      ),
      { seed: SEED, numRuns: NUM_RUNS }
    )
  })

  it('property: for any (field, In, [{value: v, label: v}]) the entries are forwarded byte-for-byte even when containing `%`', () => {
    fc.assert(
      fc.property(
        arbField,
        fc.array(fc.oneof(arbValueWithPercent, arbValueWithoutPercent), {
          minLength: 1,
          maxLength: 4
        }),
        (field, values) => {
          const filter = {
            fields: [
              {
                valueField: field,
                operator: 'In',
                value: values.map((v) => ({ value: v, label: v }))
              }
            ]
          }
          const result = convertGQL(filter, fixturesTable)
          const key = `in_${field}In`
          expect(result.variables[key]).toEqual(values)
        }
      ),
      { seed: SEED, numRuns: NUM_RUNS }
    )
  })
})
