import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

import Aql from '../azion-query-language.js'

/**
 * Spec: realtime-events-filter-operator-bug
 * Property 2 (Preservation): Supported-Operator Clauses Are Byte-Identical.
 *
 * Validates: Requirements 3.1, 3.2, 3.4, 3.5
 *
 * GOAL — for any AQL clause whose textual operator IS in the selected
 * field's supported operator list (the bug condition does NOT hold), the
 * fixed `AzionQueryLanguage.parse` and `AzionQueryLanguage.queryValidator`
 * must produce results byte-equal to today's implementation. The tests
 * below capture today's observed shapes (deterministic snapshots) and
 * derive the expected shape from the catalog for the property runs.
 *
 * EXPECTED OUTCOME on UNFIXED code: this suite PASSES — confirming the
 * baseline behavior the fix must preserve. (Task 3.5 re-runs this same
 * suite on the FIXED code and expects PASS.)
 */

// ── Suggestions catalog ───────────────────────────────────────────────
//
// Mirrors the shape produced by `parseDatasetAvailableFilters` after it
// is post-processed by the `suggestionsData` computed in
// `azion-query-language.vue`. Operator labels MUST match what
// `mapOperatorValue` produces (`Equals`, `Not Equals`, `Contains`,
// `Not Contains`, `In`, `Between`, `Less Than`, `Less Than or Equal`,
// `Greater Than`, `Greater Than or Equal`).

const STRING_FIELD_OPERATORS = [
  { label: 'Equals', value: { value: 'Eq', label: 'Equals', format: '=', type: 'String' } },
  { label: 'Not Equals', value: { value: 'Ne', label: 'Not Equals', format: '<>', type: 'String' } },
  { label: 'Contains', value: { value: 'Like', label: 'Contains', format: 'like', type: 'String' } },
  { label: 'Not Contains', value: { value: 'Ilike', label: 'Not Contains', format: 'ilike', type: 'String' } },
  { label: 'In', value: { value: 'In', label: 'In', format: 'in', type: 'String' } }
]

const INT_FIELD_OPERATORS = [
  { label: 'Equals', value: { value: 'Eq', label: 'Equals', format: '=', type: 'Int' } },
  { label: 'Not Equals', value: { value: 'Ne', label: 'Not Equals', format: '<>', type: 'Int' } },
  { label: 'Less Than', value: { value: 'Lt', label: 'Less Than', format: '<', type: 'Int' } },
  { label: 'Less Than or Equal', value: { value: 'Lte', label: 'Less Than or Equal', format: '<=', type: 'Int' } },
  { label: 'Greater Than', value: { value: 'Gt', label: 'Greater Than', format: '>', type: 'Int' } },
  {
    label: 'Greater Than or Equal',
    value: { value: 'Gte', label: 'Greater Than or Equal', format: '>=', type: 'Int' }
  },
  { label: 'Between', value: { value: 'Range', label: 'Between', format: 'between', type: 'IntRange' } },
  { label: 'In', value: { value: 'In', label: 'In', format: 'in', type: 'Int' } }
]

const SUGGESTIONS = [
  { label: 'host', value: { label: 'host', operator: STRING_FIELD_OPERATORS } },
  { label: 'status', value: { label: 'status', operator: INT_FIELD_OPERATORS } },
  { label: 'request time', value: { label: 'request time', operator: INT_FIELD_OPERATORS } }
]

// ── Deterministic snapshots (captured on UNFIXED code) ────────────────
//
// These are the exact shapes returned today for the canonical
// preservation cases listed in design.md. The fixed code must return
// the same shapes byte-for-byte.

const DETERMINISTIC_PARSE_CASES = [
  {
    query: 'status = 200',
    expected: [
      { field: 'status', value: 200, operator: 'Eq', valueField: 'status', type: 'Int' }
    ]
  },
  {
    query: 'status <> 500',
    expected: [
      { field: 'status', value: 500, operator: 'Ne', valueField: 'status', type: 'Int' }
    ]
  },
  {
    query: 'status > 100',
    expected: [
      { field: 'status', value: 100, operator: 'Gt', valueField: 'status', type: 'Int' }
    ]
  },
  {
    query: 'status >= 200',
    expected: [
      { field: 'status', value: 200, operator: 'Gte', valueField: 'status', type: 'Int' }
    ]
  },
  {
    query: 'status < 500',
    expected: [
      { field: 'status', value: 500, operator: 'Lt', valueField: 'status', type: 'Int' }
    ]
  },
  {
    query: 'status <= 499',
    expected: [
      { field: 'status', value: 499, operator: 'Lte', valueField: 'status', type: 'Int' }
    ]
  },
  {
    query: 'host like example',
    expected: [
      { field: 'host', value: 'example', operator: 'Like', valueField: 'host', type: 'String' }
    ]
  },
  {
    query: 'host ilike test',
    expected: [
      { field: 'host', value: 'test', operator: 'Ilike', valueField: 'host', type: 'String' }
    ]
  },
  {
    query: 'host = "foo bar"',
    expected: [
      { field: 'host', value: 'foo bar', operator: 'Eq', valueField: 'host', type: 'String' }
    ]
  },
  {
    query: 'host in (foo, bar)',
    expected: [
      { field: 'host', value: '(foo, bar)', operator: 'In', valueField: 'host', type: 'String' }
    ]
  },
  {
    query: 'request time between (10, 100)',
    expected: [
      {
        field: 'request time',
        value: { begin: 10, end: 100 },
        operator: 'Range',
        valueField: 'requestTime',
        type: 'IntRange'
      }
    ]
  },
  {
    query: '"request time" = 50',
    expected: [
      { field: 'request time', value: 50, operator: 'Eq', valueField: 'requestTime', type: 'Int' }
    ]
  },
  {
    query: 'status = 200 and host like x',
    expected: [
      { field: 'status', value: 200, operator: 'Eq', valueField: 'status', type: 'Int' },
      { field: 'host', value: 'x', operator: 'Like', valueField: 'host', type: 'String' }
    ]
  }
]

const DETERMINISTIC_VALIDATOR_CASES = [
  // Valid queries — no errors today.
  { query: 'status = 200', expected: [] },
  { query: 'host like example', expected: [] },
  // Multi-clause valid query — no errors today.
  { query: 'status = 200 and host like x', expected: [] },
  // Quote-error: composite field without quotes.
  {
    query: 'foo bar = 1',
    expected: ['composite fields must be included in quotes. e.g: "Upstream Status".']
  },
  // not-exists-field-error: bogus field that does not match the suggestion list.
  // The trailing space is required to enable the validator branch.
  {
    query: 'bogusField = 1 ',
    expected: [
      'some provided fields do not match the currently available ones. Please, check and try again.'
    ]
  },
  // no-space-error: missing spaces around the operator. The trailing space
  // is required to enable the validator branch. Today this query also
  // surfaces not-exists-field-error because `status=200` is treated as a
  // single token; preserve both messages exactly.
  {
    query: 'status=200 ',
    expected: [
      'some provided fields do not match the currently available ones. Please, check and try again.',
      'please add spaces between the field, operator, and value. For example, write "status = 200" instead of "status=200".'
    ]
  },
  // in-operator-parentheses-error: missing parentheses around the IN list.
  {
    query: 'host in foo, bar',
    expected: [
      "there are fields with 'in' operator that need to be inside parentheses. Please, check and try again. e.g: domain in (domain1, domain2)"
    ]
  },
  // in-operator-trailing-comma-error: trailing comma inside the IN list.
  {
    query: 'host in (a, b,)',
    expected: [
      "fields with 'in' operator that need the comma removed at the end of the values in parentheses. Please, check and try again."
    ]
  },
  // between-operator-error-not-parentheses: BETWEEN values not wrapped in parens.
  {
    query: 'status between 1, 2',
    expected: [
      'Please enclose the values for the BETWEEN operator in parentheses. For example: status between (200, 300).'
    ]
  },
  // between-operator-error: BETWEEN with one value.
  {
    query: 'status between (1)',
    expected: [
      'The BETWEEN operator requires its values to be enclosed in parentheses. For example: status between (200, 300).'
    ]
  },
  // between-operator-error-three-values: BETWEEN with three values.
  {
    query: 'status between (1, 2, 3)',
    expected: [
      'The BETWEEN operator must have exactly two values. For example: status between (200, 300).'
    ]
  },
  // between-operator-error-equal-values: BETWEEN with identical values.
  {
    query: 'status between (5, 5)',
    expected: [
      'The two values for the BETWEEN operator must be different. For example: status between (200, 300).'
    ]
  }
]

// ── Generators ────────────────────────────────────────────────────────

const arbAlphaValue = fc
  .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), {
    minLength: 2,
    maxLength: 8
  })
  .map((chars) => chars.join(''))

const arbIntValue = fc.integer({ min: 1, max: 999 })

// String-field clauses: `host <textualOp> <alphaValue>` with single-token,
// non-IN, non-Between operators.
const arbStringClause = fc
  .tuple(
    fc.constantFrom('host'),
    fc.constantFrom(
      { textual: '=', operator: 'Eq', type: 'String' },
      { textual: '<>', operator: 'Ne', type: 'String' },
      { textual: 'like', operator: 'Like', type: 'String' },
      { textual: 'ilike', operator: 'Ilike', type: 'String' }
    ),
    arbAlphaValue
  )
  .map(([field, opInfo, value]) => ({
    field,
    valueField: field,
    opInfo,
    value,
    rawValue: value,
    query: `${field} ${opInfo.textual} ${value}`
  }))

// Int-field clauses: single-token, non-IN, non-Between operators.
const arbIntClause = fc
  .tuple(
    fc.constantFrom('status'),
    fc.constantFrom(
      { textual: '=', operator: 'Eq', type: 'Int' },
      { textual: '<>', operator: 'Ne', type: 'Int' },
      { textual: '<', operator: 'Lt', type: 'Int' },
      { textual: '<=', operator: 'Lte', type: 'Int' },
      { textual: '>', operator: 'Gt', type: 'Int' },
      { textual: '>=', operator: 'Gte', type: 'Int' }
    ),
    arbIntValue
  )
  .map(([field, opInfo, value]) => ({
    field,
    valueField: field,
    opInfo,
    value: Number(value),
    rawValue: String(value),
    query: `${field} ${opInfo.textual} ${value}`
  }))

// BETWEEN on Int — value pair with begin < end so the clause never trips
// the validator's equal-values branch.
const arbBetweenClause = fc
  .tuple(
    fc.constantFrom('status', 'request time'),
    fc.tuple(fc.integer({ min: 1, max: 99 }), fc.integer({ min: 100, max: 999 }))
  )
  .map(([rawField, [begin, end]]) => {
    const field = rawField
    const valueField = field === 'request time' ? 'requestTime' : 'status'
    const queryField = field.includes(' ') ? `"${field}"` : field
    return {
      field,
      valueField,
      opInfo: { textual: 'between', operator: 'Range', type: 'IntRange' },
      value: { begin, end },
      rawValue: `(${begin}, ${end})`,
      query: `${queryField} between (${begin}, ${end})`
    }
  })

const arbSupportedClause = fc.oneof(arbStringClause, arbIntClause, arbBetweenClause)

// ── Tests ─────────────────────────────────────────────────────────────

describe('AQL parser preservation (Property 2) — supported-operator clauses', () => {
  it.each(DETERMINISTIC_PARSE_CASES)(
    'parse(`$query`) returns the same shape as today',
    ({ query, expected }) => {
      const aql = new Aql()
      const parsed = aql.parse(query, SUGGESTIONS, [])
      expect(parsed).toEqual(expected)
    }
  )

  it('property: for any (field, supportedOp, value) the parser emits exactly one clause with the expected shape', () => {
    fc.assert(
      fc.property(arbSupportedClause, (clause) => {
        const aql = new Aql()
        const parsed = aql.parse(clause.query, SUGGESTIONS, [])

        // Exactly one clause emitted.
        expect(parsed).toHaveLength(1)

        const got = parsed[0]

        // Every parsed clause carries the canonical five fields.
        expect(got).toHaveProperty('field')
        expect(got).toHaveProperty('valueField')
        expect(got).toHaveProperty('operator')
        expect(got).toHaveProperty('value')
        expect(got).toHaveProperty('type')

        // The operator is the resolved value drawn from the catalog.
        expect(got.operator).toBe(clause.opInfo.operator)
        // The type matches the catalog operator's declared type.
        expect(got.type).toBe(clause.opInfo.type)
        // The valueField equals convertFieldToCamelCase(field).
        expect(got.valueField).toBe(clause.valueField)
        // The field equals the suggestion label.
        expect(got.field).toBe(clause.field)
        // The value is exactly the captured shape (Number for Int, object
        // for IntRange, string for String).
        expect(got.value).toEqual(clause.value)
      }),
      { numRuns: 80 }
    )
  })

  it('property: multi-clause AND queries preserve clause order and shapes', () => {
    fc.assert(
      fc.property(arbStringClause, arbIntClause, (left, right) => {
        const aql = new Aql()
        const query = `${left.query} and ${right.query}`
        const parsed = aql.parse(query, SUGGESTIONS, [])

        expect(parsed).toHaveLength(2)
        expect(parsed[0].field).toBe(left.field)
        expect(parsed[0].operator).toBe(left.opInfo.operator)
        expect(parsed[0].value).toEqual(left.value)
        expect(parsed[0].valueField).toBe(left.valueField)
        expect(parsed[0].type).toBe(left.opInfo.type)
        expect(parsed[1].field).toBe(right.field)
        expect(parsed[1].operator).toBe(right.opInfo.operator)
        expect(parsed[1].value).toEqual(right.value)
        expect(parsed[1].valueField).toBe(right.valueField)
        expect(parsed[1].type).toBe(right.opInfo.type)
      }),
      { numRuns: 50 }
    )
  })
})

describe('AQL validator preservation (Property 2) — pre-existing branches', () => {
  it.each(DETERMINISTIC_VALIDATOR_CASES)(
    'queryValidator(`$query`) returns the same messages as today',
    ({ query, expected }) => {
      const aql = new Aql()
      const errors = aql.queryValidator(query, SUGGESTIONS)
      expect(errors).toEqual(expected)
    }
  )

  it('property: validator returns no error for any well-formed (field, supportedOp, value) clause', () => {
    fc.assert(
      fc.property(arbSupportedClause, (clause) => {
        const aql = new Aql()
        const errors = aql.queryValidator(clause.query, SUGGESTIONS)
        // A well-formed supported-operator clause must not surface any
        // validator error today. (BETWEEN clauses with begin < end never
        // trip the equal-values branch.)
        expect(errors).toEqual([])
      }),
      { numRuns: 80 }
    )
  })
})
