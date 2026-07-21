/* eslint-env node */
/**
 * OpenAPI drift engine — pure, side-effect-free functions shared by the
 * Playwright drift spec (`version-api-drift.contract.spec.js`) and the unit
 * test that proves the mechanism (`src/tests/contracts/openapi-drift-engine.test.js`).
 *
 * WHY A SEPARATE MODULE: the drift check consumes the PUBLISHED OpenAPI spec of
 * a target environment (an open, no-auth URL — DRF/spectacular `/schema/`) and
 * asserts that the fields the front's yup schemas depend on
 * (`tests/contracts/schemas/**`) exist, with compatible types, in that spec.
 * Extracting the comparison into pure functions lets us exercise every branch
 * against a local fixture — so the drift is provably real even from a network
 * where the real `/schema/` URL is unreachable (edge returns 204 here).
 *
 * No I/O, no `fetch`, no `process` reads: the spec/URL are passed in. This keeps
 * the engine unit-testable and the Playwright spec the only place that does I/O.
 */

/**
 * yup primitive type → the OpenAPI `type` values we accept as compatible.
 * `mixed` (yup's any) matches anything and is handled in `isTypeCompatible`.
 */
export const YUP_TO_OPENAPI = {
  string: ['string'],
  number: ['number', 'integer'],
  boolean: ['boolean'],
  object: ['object'],
  array: ['array']
}

const isRef = (node) => Boolean(node) && typeof node === 'object' && typeof node.$ref === 'string'

/**
 * Follows a `$ref` chain to the concrete schema node, cyclic-safe. Only local
 * refs (`#/components/schemas/...`) are supported; a foreign/unresolvable ref
 * returns the node untouched so the caller can decide (never throws on cycles).
 *
 * @param {object} spec  parsed OpenAPI document
 * @param {object} node  a schema node, possibly `{ $ref }`
 * @param {Set<string>} [seen] internal cycle guard
 * @returns {object} the resolved schema node
 */
export const resolveRef = (spec, node, seen = new Set()) => {
  let current = node
  while (isRef(current)) {
    const ref = current.$ref
    if (seen.has(ref)) return current // cycle — stop, return the ref node as-is
    seen.add(ref)
    if (!ref.startsWith('#/')) return current
    const segments = ref.slice(2).split('/')
    const target = segments.reduce(
      (acc, key) => (acc && typeof acc === 'object' ? acc[decodeURIComponent(key)] : undefined),
      spec
    )
    if (target === undefined) return current // dangling ref — leave for the caller
    current = target
  }
  return current
}

/**
 * Derives the list of top-level fields the front depends on from a yup schema,
 * via `schema.describe()`. Returns `{ name, type, nullable }` per field, where
 * `type` is yup's primitive tag (`string|number|boolean|object|array|mixed`).
 *
 * @param {import('yup').AnySchema} yupSchema
 * @returns {{ name: string, type: string, nullable: boolean }[]}
 */
export const describeFields = (yupSchema) => {
  const described = yupSchema.describe()
  const fields = described.fields || {}
  return Object.entries(fields).map(([name, def]) => ({
    name,
    type: def.type,
    nullable: Boolean(def.nullable)
  }))
}

/**
 * Whether a yup field type is satisfied by a single OpenAPI `type` string.
 * `mixed` (yup any) accepts anything; an unknown yup type never false-fails.
 *
 * @param {string} yupType
 * @param {string} openApiType
 * @returns {boolean}
 */
export const isTypeCompatible = (yupType, openApiType) => {
  if (yupType === 'mixed') return true
  const allowed = YUP_TO_OPENAPI[yupType]
  if (!allowed) return true
  return allowed.includes(openApiType)
}

const escapeSegment = (segment) => segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Discovers, for a workspace resource segment (e.g. `applications`), the two
 * version endpoints in the published spec:
 *   - `list`   — `.../workspace/<segment>/{...}/versions`
 *   - `detail` — `.../workspace/<segment>/{...}/versions/{...}`
 * Matching is anchored to the workspace segment + `versions` sub-resource and
 * tolerates the API's own prefix (`/v4`, host mount, etc.).
 *
 * @param {object} spec
 * @param {string} segment  workspace path segment (plural, snake_case)
 * @returns {{ list: string|null, detail: string|null }}
 */
export const findVersionPaths = (spec, segment) => {
  const paths = spec?.paths && typeof spec.paths === 'object' ? Object.keys(spec.paths) : []
  const seg = escapeSegment(segment)
  // one resource id param, then `/versions`, optionally a version id param.
  // eslint-disable-next-line security/detect-non-literal-regexp -- segment comes from our hardcoded resource list, not user input
  const listRe = new RegExp(`/workspace/${seg}/\\{[^/}]+\\}/versions/?$`)
  // eslint-disable-next-line security/detect-non-literal-regexp -- segment comes from our hardcoded resource list, not user input
  const detailRe = new RegExp(`/workspace/${seg}/\\{[^/}]+\\}/versions/\\{[^/}]+\\}/?$`)
  const list = paths.find((path) => listRe.test(path)) ?? null
  const detail = paths.find((path) => detailRe.test(path)) ?? null
  return { list, detail }
}

/**
 * Resolves the schema of a `2xx` JSON response for a path-item method.
 *
 * @param {object} spec
 * @param {object} pathItem  spec.paths[path]
 * @param {string} method    lowercased HTTP method
 * @returns {object|null} the (unresolved) response schema node, or null
 */
export const getResponseSchema = (spec, pathItem, method) => {
  const operation = pathItem?.[method]
  const responses = operation?.responses
  if (!responses) return null
  const status = ['200', '201', 'default'].find((code) => responses[code])
  const content = status ? responses[status]?.content : null
  const media = content?.['application/json'] ?? (content ? Object.values(content)[0] : null)
  return media?.schema ?? null
}

/**
 * Resolves the schema of a request body (first JSON media type) for a method.
 *
 * @param {object} spec
 * @param {object} pathItem
 * @param {string} method
 * @returns {object|null}
 */
export const getRequestBodySchema = (spec, pathItem, method) => {
  const operation = pathItem?.[method]
  const content = operation?.requestBody?.content
  if (!content) return null
  const media = content['application/json'] ?? Object.values(content)[0]
  return media?.schema ?? null
}

/**
 * Peels response envelopes down to the schema of a single resource ITEM.
 * The published API may wrap payloads in `data` (object or array) and/or
 * `results` (array). Descends through both, resolving `$ref`s, until it reaches
 * the object schema whose `properties` describe one version item.
 *
 * @param {object} spec
 * @param {object} schemaNode  a (possibly wrapped, possibly `$ref`) schema
 * @returns {{ itemSchema: object|null, envelope: string[] }}
 */
export const unwrapToItemSchema = (spec, schemaNode) => {
  const envelope = []
  let current = resolveRef(spec, schemaNode)
  // Guard against pathological nesting.
  for (let depth = 0; depth < 8 && current && typeof current === 'object'; depth += 1) {
    const props = current.properties
    if (props?.results) {
      envelope.push('results')
      const results = resolveRef(spec, props.results)
      current = resolveRef(spec, results.items ?? results)
      continue
    }
    if (props?.data) {
      envelope.push('data')
      current = resolveRef(spec, props.data)
      continue
    }
    if (current.type === 'array' && current.items) {
      envelope.push('array')
      current = resolveRef(spec, current.items)
      continue
    }
    break
  }
  const itemSchema = current && typeof current === 'object' && current.properties ? current : null
  return { itemSchema, envelope }
}

const specTypesOf = (prop) => {
  if (Array.isArray(prop.type)) return prop.type.filter((type) => type !== 'null')
  if (typeof prop.type === 'string') return [prop.type]
  // No explicit `type` (e.g. pure composition or `$ref` object) — accept.
  return []
}

/**
 * RESPONSE-SIDE drift: every field the front READS must exist in the item
 * schema's `properties`, with a compatible type. Returns a structured issue per
 * offending field ({ field, expected, spec, kind }); empty means no drift.
 *
 * @param {{ name: string, type: string }[]} ourFields  from `describeFields`
 * @param {object} itemSchema  resolved item schema (has `properties`)
 * @param {object} spec
 * @returns {{ field: string, expected: string, spec: string, kind: string }[]}
 */
export const compareResponseFields = (ourFields, itemSchema, spec) => {
  const properties = itemSchema?.properties ?? {}
  const issues = []
  for (const field of ourFields) {
    const raw = properties[field.name]
    if (raw === undefined) {
      issues.push({ field: field.name, expected: field.type, spec: 'absent', kind: 'missing' })
      continue
    }
    const prop = resolveRef(spec, raw)
    const specTypes = specTypesOf(prop)
    if (specTypes.length === 0) continue // untyped/composed spec node — nothing to contradict
    const ok = specTypes.some((type) => isTypeCompatible(field.type, type))
    if (!ok) {
      issues.push({
        field: field.name,
        expected: field.type,
        spec: specTypes.join('|'),
        kind: 'type'
      })
    }
  }
  return issues
}

/**
 * REQUEST-SIDE drift (lighter): every field the front WRITES should exist in
 * the request body's `properties`. A missing field is a FAILURE only when the
 * spec forbids extras (`additionalProperties === false`); otherwise it is a
 * non-blocking warning (the API tolerates unknown input).
 *
 * @param {{ name: string }[]} ourFields
 * @param {object} requestSchema  a (possibly `$ref`) request body schema
 * @param {object} spec
 * @returns {{ issues: object[], warnings: object[], resolvable: boolean }}
 */
export const compareRequestFields = (ourFields, requestSchema, spec) => {
  if (!requestSchema) return { issues: [], warnings: [], resolvable: false }
  const resolved = resolveRef(spec, requestSchema)
  const properties = resolved?.properties ?? {}
  const additionalForbidden = resolved?.additionalProperties === false
  const issues = []
  const warnings = []
  for (const field of ourFields) {
    if (properties[field.name] !== undefined) continue
    if (additionalForbidden) {
      issues.push({ field: field.name, kind: 'missing-strict' })
    } else {
      warnings.push({ field: field.name, kind: 'missing-open' })
    }
  }
  return { issues, warnings, resolvable: true }
}
