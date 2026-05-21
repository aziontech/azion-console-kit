import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

import Aql from '../azion-query-language.js'

/**
 * Spec: realtime-events-multiple-bugs — Bug 1 (Like/Ilike wildcard handling).
 *
 * Validates: Requirements 1.* (AQL parser preserves user-supplied `%`
 * wildcards byte-for-byte in the parsed clause `value`).
 *
 * GOAL — assert `AzionQueryLanguage.parse` preserves the `%` characters the
 * user typed in the textual AQL query for `like`/`ilike` clauses. The
 * parser layer must NOT strip, normalise, or duplicate the wildcard
 * characters: the `value` field of the parsed clause must equal the third
 * whitespace-separated token of the input query byte-for-byte.
 *
 * EXPECTED OUTCOME on UNFIXED code: this suite PASSES — the parser is
 * already correct (the wildcard mishandling happens later, in
 * `convertGQL.formatValueContainOperator`). Capturing the property here is
 * a guardrail so any future regression of the parser surfaces immediately.
 */

// ── Suggestions catalog ───────────────────────────────────────────────
//
// Mirrors the shape produced by `parseDatasetAvailableFilters` after it
// is post-processed by `suggestionsData` in `azion-query-language.vue`.

const STRING_FIELD_OPERATORS = [
  { label: 'Equals', value: { value: 'Eq', label: 'Equals', format: '=', type: 'String' } },
  {
    label: 'Not Equals',
    value: { value: 'Ne', label: 'Not Equals', format: '<>', type: 'String' }
  },
  {
    label: 'Contains',
    value: { value: 'Like', label: 'Contains', format: 'like', type: 'String' }
  },
  {
    label: 'Not Contains',
    value: { value: 'Ilike', label: 'Not Contains', format: 'ilike', type: 'String' }
  },
  { label: 'In', value: { value: 'In', label: 'In', format: 'in', type: 'String' } }
]

const SUGGESTIONS = [
  { label: 'host', value: { label: 'host', operator: STRING_FIELD_OPERATORS } },
  { label: 'status', value: { label: 'status', operator: STRING_FIELD_OPERATORS } }
]

const SEED = 20240517
const NUM_RUNS = 60

// ── Generators ────────────────────────────────────────────────────────

const arbField = fc.constantFrom('host', 'status')

const arbToken = fc.stringMatching(/^[a-z0-9.-]{1,12}$/)

// Three branches: prefix wildcard `value%`, suffix wildcard `%value`, and
// both-sides wildcard `%value%`. The captured `raw` is the exact text that
// must round-trip through the parser byte-for-byte.
const arbWildcardValue = fc.oneof(
  // eslint-disable-next-line id-length
  arbToken.map((t) => `${t}%`),
  // eslint-disable-next-line id-length
  arbToken.map((t) => `%${t}`),
  // eslint-disable-next-line id-length
  arbToken.map((t) => `%${t}%`)
)

const arbLikeKeyword = fc.constantFrom('like', 'ilike')

// ── Deterministic cases (captured on UNFIXED code) ────────────────────

const DETERMINISTIC_CASES = [
  {
    query: 'host like app%',
    expected: [
      { field: 'host', value: 'app%', operator: 'Like', valueField: 'host', type: 'String' }
    ]
  },
  {
    query: 'host like %app',
    expected: [
      { field: 'host', value: '%app', operator: 'Like', valueField: 'host', type: 'String' }
    ]
  },
  {
    query: 'host like %app%',
    expected: [
      { field: 'host', value: '%app%', operator: 'Like', valueField: 'host', type: 'String' }
    ]
  }
]

// ── Tests ─────────────────────────────────────────────────────────────

describe('AQL parser Like/Ilike wildcard preservation (Bug 1)', () => {
  it.each(DETERMINISTIC_CASES)(
    'parse(`$query`) preserves the `%` wildcards in the value',
    ({ query, expected }) => {
      const aql = new Aql()
      const parsed = aql.parse(query, SUGGESTIONS, [])
      expect(parsed).toEqual(expected)
    }
  )

  it('property: the parsed clause `value` equals the third whitespace-token of the input query byte-for-byte', () => {
    fc.assert(
      fc.property(arbField, arbLikeKeyword, arbWildcardValue, (field, keyword, value) => {
        const query = `${field} ${keyword} ${value}`
        const aql = new Aql()
        const parsed = aql.parse(query, SUGGESTIONS, [])

        expect(parsed).toHaveLength(1)
        const clause = parsed[0]

        // Operator resolves to the canonical Like/Ilike form.
        expect(['Like', 'Ilike']).toContain(clause.operator)
        if (keyword === 'like') expect(clause.operator).toBe('Like')
        if (keyword === 'ilike') expect(clause.operator).toBe('Ilike')

        // The captured value must be byte-for-byte equal to the value
        // segment of the input query (split by whitespace, third token).
        const expectedValue = query.split(' ')[2]
        expect(clause.value).toBe(expectedValue)
      }),
      { seed: SEED, numRuns: NUM_RUNS }
    )
  })
})
