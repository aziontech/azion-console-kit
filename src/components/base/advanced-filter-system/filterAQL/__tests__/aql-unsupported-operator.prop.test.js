import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

import Aql from '../azion-query-language.js'

/**
 * Spec: realtime-events-filter-operator-bug
 * Property 1 (Bug Condition): Unresolved Operator Never Reaches GraphQL.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4
 *
 * GOAL — surface counterexamples that demonstrate the bug exists for the
 * parser layer (`AzionQueryLanguage.parse`), the GraphQL filter builder
 * layer (`useEventsData.buildApiFilters`, reproduced here), and the
 * validator (`AzionQueryLanguage.queryValidator`).
 *
 * EXPECTED OUTCOME on UNFIXED code: this suite FAILS — failure confirms
 * the bug exists. The deterministic case `domain like api%` exposes a
 * parsed clause `{ operator: undefined, valueField: 'configurationId', ... }`,
 * the builder reproduction emits the literal key `configurationIdundefined`,
 * and the validator returns no message about the unsupported operator.
 */

// ── Suggestions catalog ───────────────────────────────────────────────
//
// Mirrors the shape produced by `parseDatasetAvailableFilters` after it
// is post-processed by the `suggestionsData` computed in
// `azion-query-language.vue`:
//
//   {
//     label,
//     value: {
//       label,
//       operator: [{ label, value: { value, label, format, type } }, ...]
//     }
//   }

const STRING_FIELD_OPERATORS = [
  { label: 'Equals', value: { value: 'Eq', label: 'Equals', format: '=', type: 'String' } },
  { label: 'Not Equals', value: { value: 'Ne', label: 'Not Equals', format: '<>', type: 'String' } },
  { label: 'Contains', value: { value: 'Like', label: 'Contains', format: 'like', type: 'String' } },
  { label: 'Not Contains', value: { value: 'Ilike', label: 'Not Contains', format: 'ilike', type: 'String' } },
  { label: 'In', value: { value: 'In', label: 'In', format: 'in', type: 'String' } }
]

const SUGGESTIONS = [
  {
    label: 'domain',
    value: {
      label: 'domain',
      operator: [
        {
          label: 'In',
          value: { value: 'In', label: 'In', format: 'in', type: 'ArrayObjectDomain' }
        }
      ]
    }
  },
  {
    label: 'host',
    value: {
      label: 'host',
      operator: STRING_FIELD_OPERATORS
    }
  },
  {
    label: 'status',
    value: {
      label: 'status',
      operator: STRING_FIELD_OPERATORS
    }
  }
]

// Bug triples — every (field, textualOperator) pair where the textual
// operator is in the AQL alphabet but is NOT in the field's supported
// operator list. These are exactly the inputs that should trigger the
// bug on UNFIXED code.
const ALPHABET = ['=', '<>', '<', '<=', '>', '>=', 'like', 'ilike', 'between', 'in']

const SUPPORTED_TEXTUAL_OPS = {
  domain: new Set(['in']),
  host: new Set(['=', '<>', 'like', 'ilike', 'in']),
  status: new Set(['=', '<>', 'like', 'ilike', 'in'])
}

const BUG_PAIRS = ['domain', 'host', 'status']
  .flatMap((field) =>
    ALPHABET.filter((op) => !SUPPORTED_TEXTUAL_OPS[field].has(op)).map((op) => ({ field, op }))
  )

// ── Builder reproduction ──────────────────────────────────────────────
//
// Thin reproduction of the `buildApiFilters` closure inside
// `useEventsData.js`. Kept byte-for-byte equivalent so that any malformed
// key produced here mirrors what the real composable would emit.
const buildApiFiltersReproduction = (fields) => {
  const filters = {}
  if (fields?.length) {
    fields.forEach((ff) => {
      const value = ff.value
      if (ff.operator === 'In') {
        filters.in = filters.in || {}
        filters.in[ff.valueField] = value
      } else {
        filters.and = filters.and || {}
        filters.and[ff.valueField + ff.operator] = value
      }
    })
  }
  return filters
}

// ── Query rendering ───────────────────────────────────────────────────
const renderQuery = (field, textualOp, value) => {
  if (textualOp === 'between') return `${field} between (${value.begin}, ${value.end})`
  if (textualOp === 'in') return `${field} in (${value})`
  return `${field} ${textualOp} ${value}`
}

// ── Generators ────────────────────────────────────────────────────────
const arbAlphaValue = fc
  .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), {
    minLength: 2,
    maxLength: 8
  })
  .map((chars) => chars.join(''))

const arbIntValue = fc.integer({ min: 1, max: 999 }).map(String)

const arbSimpleValue = fc.oneof(arbAlphaValue, arbIntValue)

const arbBetweenPair = fc
  .tuple(fc.integer({ min: 1, max: 99 }), fc.integer({ min: 100, max: 999 }))
  .map(([begin, end]) => ({ begin, end }))

const arbBugPair = fc.constantFrom(...BUG_PAIRS)

// ── Tests ─────────────────────────────────────────────────────────────

describe('AQL unsupported field+operator bug condition (Property 1)', () => {
  it('deterministic case: parse(`domain like api%`) MUST NOT emit a clause with a non-string operator', () => {
    const aql = new Aql()
    const query = 'domain like api%'

    const parsed = aql.parse(query, SUGGESTIONS, [])

    // The parser-layer Bug_Condition: every emitted clause MUST have a
    // non-empty string `operator`. On unfixed code this fails because the
    // parser emits `{ operator: undefined, valueField: 'configurationId', ... }`.
    for (const clause of parsed) {
      expect(typeof clause.operator).toBe('string')
      expect(clause.operator.length).toBeGreaterThan(0)
    }
  })

  it('deterministic case: buildApiFilters(parse(`domain like api%`)) MUST NOT emit a malformed key', () => {
    const aql = new Aql()
    const query = 'domain like api%'

    const parsed = aql.parse(query, SUGGESTIONS, [])
    const apiFilters = buildApiFiltersReproduction(parsed)

    const allKeys = [
      ...Object.keys(apiFilters.and || {}),
      ...Object.keys(apiFilters.in || {})
    ]

    // The builder-layer Bug_Condition: no key may contain the literal
    // substring "undefined" and no key may equal a bare valueField with an
    // empty operator suffix. On unfixed code the key
    // "configurationIdundefined" is emitted.
    for (const key of allKeys) {
      expect(key).not.toContain('undefined')
      const matchingClause = parsed.find((clause) => clause.valueField === key)
      // When the matching clause's operator is 'In' the key being equal to
      // the valueField is correct (filters.in shape). For all other clauses
      // a key equal to the bare valueField means the operator was empty.
      if (matchingClause && matchingClause.operator !== 'In') {
        expect(key).not.toBe(matchingClause.valueField)
      }
    }
  })

  it('deterministic case: queryValidator(`domain like api%`) MUST surface a message naming the field and the operator', () => {
    const aql = new Aql()
    const query = 'domain like api%'

    const errors = aql.queryValidator(query, SUGGESTIONS)
    const hasFieldOperatorError = errors.some(
      (msg) =>
        typeof msg === 'string' &&
        msg.toLowerCase().includes('domain') &&
        msg.toLowerCase().includes('like')
    )

    // On unfixed code `errors` is an empty array, so this assertion fails.
    expect(hasFieldOperatorError).toBe(true)
  })

  it('property: for every (field, textualOperator, value) where textualOperator is unsupported by the field, the parser+builder+validator never produce a malformed pipeline', () => {
    fc.assert(
      fc.property(
        arbBugPair,
        arbSimpleValue,
        arbAlphaValue,
        arbBetweenPair,
        ({ field, op }, simpleValue, inToken, betweenPair) => {
          const aql = new Aql()

          let value
          if (op === 'between') value = betweenPair
          else if (op === 'in') value = inToken
          else value = simpleValue

          const query = renderQuery(field, op, value)

          // ── Parser-layer Bug_Condition assertion ────────────────────
          const parsed = aql.parse(query, SUGGESTIONS, [])
          for (const clause of parsed) {
            expect(typeof clause.operator).toBe('string')
            expect(clause.operator.length).toBeGreaterThan(0)
          }

          // ── Builder-layer Bug_Condition assertion ───────────────────
          const apiFilters = buildApiFiltersReproduction(parsed)
          const allKeys = [
            ...Object.keys(apiFilters.and || {}),
            ...Object.keys(apiFilters.in || {})
          ]
          for (const key of allKeys) {
            expect(key).not.toContain('undefined')
            const matchingClause = parsed.find((clause) => clause.valueField === key)
            if (matchingClause && matchingClause.operator !== 'In') {
              expect(key).not.toBe(matchingClause.valueField)
            }
          }

          // ── Validator assertion ─────────────────────────────────────
          const errors = aql.queryValidator(query, SUGGESTIONS)
          const fieldLower = field.toLowerCase()
          const opLower = op.toLowerCase()
          const hasFieldOperatorError = errors.some(
            (msg) =>
              typeof msg === 'string' &&
              msg.toLowerCase().includes(fieldLower) &&
              msg.toLowerCase().includes(opLower)
          )
          expect(hasFieldOperatorError).toBe(true)
        }
      ),
      { numRuns: 60 }
    )
  })
})
