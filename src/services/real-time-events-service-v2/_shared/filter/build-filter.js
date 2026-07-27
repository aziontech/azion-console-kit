/**
 * Single implementation of filter clause coercion + grouping for Real-Time
 * Events v2. Produces the `{ and, in, or }` filter shape consumed by the
 * GraphQL query builders (rendered downstream by `build-filter-parts.js`).
 *
 * Pure and framework-agnostic: no Vue, no I/O, no GraphQL rendering, no field
 * capability lookup. Reproduces the previous inline `buildApiFilters` from
 * `useEventsData` byte-for-byte:
 *   - no OR connector → flat AND-only filter `{ and, in }`
 *   - any OR connector → `{ or: [ { and, in }, ... ] }`, splitting clauses into
 *     AND-groups at each OR boundary (SQL precedence: AND binds tighter than
 *     OR, so `a AND b OR c` ⇒ `(a AND b) OR c`).
 */

export const VALID_OPERATORS = new Set([
  'In',
  'Eq',
  'Ne',
  'Like',
  'Ilike',
  'Range',
  'Lt',
  'Lte',
  'Gt',
  'Gte'
])

export const SAFE_FIELD_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/

/**
 * Coerces a raw filter value to the type declared by the clause.
 * Arrays are coerced element-wise, unwrapping `{ value }` option objects.
 * Non-coercible / non-finite values pass through unchanged.
 *
 * @param {*} rawValue
 * @param {string} type
 * @returns {*}
 */
export const coerceFilterValue = (rawValue, type) => {
  const nt = String(type || '').toLowerCase()
  if (Array.isArray(rawValue))
    return rawValue.map((iv) => coerceFilterValue(iv?.value !== undefined ? iv.value : iv, type))
  if (nt === 'int') {
    const nv = parseInt(rawValue, 10)
    return Number.isFinite(nv) ? nv : rawValue
  }
  if (nt === 'float' || nt === 'number') {
    const nv = parseFloat(rawValue)
    return Number.isFinite(nv) ? nv : rawValue
  }
  if (nt === 'boolean' || nt === 'bool') {
    if (rawValue === true || rawValue === false) return rawValue
    const sv = String(rawValue).toLowerCase()
    if (sv === 'true') return true
    if (sv === 'false') return false
    return rawValue
  }
  return rawValue
}

/**
 * Builds one AND-group object (`{ and, in }`) from a list of clauses.
 *
 * Defensive guard: clauses whose operator is missing, falsy, or non-string are
 * skipped. This prevents emitting malformed GraphQL filter keys like
 * `${valueField}undefined` when the parser (or any other upstream source) hands
 * us a clause without a resolved operator.
 * See spec: realtime-events-filter-operator-bug — Requirement 2.3, 2.4.
 *
 * Security guard: the resolved `valueField`/`operator` become the GraphQL query
 * key (`valueField + operator`) that is spliced verbatim into the query string
 * downstream. Only whitelisted operators and identifier-shaped field names are
 * allowed through, so a tampered `?filters=` hash cannot inject GraphQL
 * structure (extra selections, fragment breakout) via a crafted field/operator.
 *
 * @param {Array<object>} clauses
 * @returns {object}
 */
export const buildFilterGroup = (clauses) => {
  const group = {}
  clauses.forEach((ff) => {
    if (typeof ff.operator !== 'string' || !VALID_OPERATORS.has(ff.operator)) return
    if (typeof ff.valueField !== 'string' || !SAFE_FIELD_NAME.test(ff.valueField)) return
    const value = coerceFilterValue(ff.value, ff.type)
    if (ff.operator === 'In') {
      group.in = group.in || {}
      const existing = Array.isArray(group.in[ff.valueField]) ? group.in[ff.valueField] : []
      group.in[ff.valueField] = [...existing, ...(Array.isArray(value) ? value : [value])]
    } else {
      group.and = group.and || {}
      group.and[ff.valueField + ff.operator] = value
    }
  })
  return group
}

/**
 * Produces the filter shape consumed by the query builders:
 *   - no OR connector → flat AND-only filter `{ and, in }`
 *   - any OR connector → `{ or: [ { and, in }, ... ] }`, splitting clauses into
 *     AND-groups at each OR boundary. The events GraphQL filter supports nested
 *     `or`, verified against the live schema.
 *
 * Byte-equivalent to the legacy `useEventsData.buildApiFilters` (which read
 * `filterData.value?.fields`); here the fields list is passed in directly.
 *
 * @param {Array<object>} fields
 * @returns {{ and?: object, in?: object, or?: Array<object> }}
 */
export const buildFilter = (fields) => {
  if (!Array.isArray(fields) || !fields.length) return {}

  const hasOr = fields.some((ff) => String(ff?.logicalOperator).toUpperCase() === 'OR')
  if (!hasOr) return buildFilterGroup(fields)

  const groups = []
  fields.forEach((ff) => {
    if (!groups.length || String(ff?.logicalOperator).toUpperCase() === 'OR') groups.push([])
    groups[groups.length - 1].push(ff)
  })
  return { or: groups.map(buildFilterGroup) }
}
