/**
 * Renders the extra (non-tsRange) portion of an events GraphQL filter into the
 * three pieces every aggregation query builder needs:
 *   - `fragments`     → strings spliced into the `filter: { ... }` block
 *   - `declarations`  → strings spliced into the `query ( ... )` params
 *   - `variables`     → the GraphQL variables object
 *
 * Accepts the `{ and, in, or }` shape produced by `buildApiFilters`:
 *   - no OR  → flat AND-only filter (`{ and, in }`) → top-level `key: $var`
 *   - OR     → `{ or: [ { and, in }, ... ] }` → nested `or: [ { ... }, ... ]`
 *
 * Variables are namespaced with a caller-supplied `prefix` plus a counter so
 * the same field can appear in multiple OR groups without colliding.
 */

const scalarType = (value) =>
  typeof value === 'number' ? (Number.isInteger(value) ? 'Int' : 'Float') : 'String'

const normalizeInValues = (values) =>
  (Array.isArray(values) ? values : [values]).map((item) =>
    String(item?.value !== undefined ? item.value : item)
  )

export function buildFilterParts(filters, prefix = 'flt') {
  const fragments = []
  const declarations = []
  const variables = {}
  let counter = 0

  // Render one AND-group ({ and, in }) into `key: $var` fragment parts,
  // populating `declarations` and `variables` as a side effect.
  const renderGroup = (group) => {
    const parts = []
    Object.entries(group?.and || {}).forEach(([key, value]) => {
      const varName = `${prefix}${counter++}`
      variables[varName] = value
      declarations.push(`$${varName}: ${scalarType(value)}`)
      parts.push(`${key}: $${varName}`)
    })
    Object.entries(group?.in || {}).forEach(([key, value]) => {
      const varName = `${prefix}${counter++}`
      variables[varName] = normalizeInValues(value)
      // IN values are normalized to strings (mirrors the legacy builders), so
      // the list type is always `[String]`.
      declarations.push(`$${varName}: [String]`)
      const gqlKey = key.endsWith('In') ? key : `${key}In`
      parts.push(`${gqlKey}: $${varName}`)
    })
    return parts
  }

  if (Array.isArray(filters?.or) && filters.or.length) {
    const groupFragments = filters.or.map((group) => `{ ${renderGroup(group).join(', ')} }`)
    fragments.push(`or: [ ${groupFragments.join(', ')} ]`)
  } else {
    fragments.push(...renderGroup({ and: filters?.and, in: filters?.in }))
  }

  return { fragments, declarations, variables }
}
