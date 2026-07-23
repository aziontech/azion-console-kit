import { describe, it, expect } from 'vitest'

import {
  YUP_TO_OPENAPI,
  resolveRef,
  describeFields,
  isTypeCompatible,
  findVersionPaths,
  getResponseSchema,
  getRequestBodySchema,
  unwrapToItemSchema,
  applyKnownDrift,
  findStaleKnownDrift,
  compareResponseFields,
  compareRequestFields
} from '../../../tests/contracts/openapi-drift-engine'
import { contractSchemas } from '../../../tests/contracts/schemas'
import sampleSpec from '../../../tests/contracts/fixtures/openapi.sample.json'

const detailItem = (segment) => {
  const { detail } = findVersionPaths(sampleSpec, segment)
  const schema = getResponseSchema(sampleSpec, sampleSpec.paths[detail], 'get')
  return unwrapToItemSchema(sampleSpec, schema)
}

describe('openapi-drift-engine — $ref resolution', () => {
  it('resolves a local $ref to its concrete schema', () => {
    const resolved = resolveRef(sampleSpec, { $ref: '#/components/schemas/ModuleFlag' })
    expect(resolved.type).toBe('object')
    expect(resolved.properties.enabled.type).toBe('boolean')
  })

  it('is cyclic-safe: a self-referential $ref does not hang', () => {
    const app = resolveRef(sampleSpec, { $ref: '#/components/schemas/ApplicationVersion' })
    const self = resolveRef(sampleSpec, app.properties.self)
    expect(self.type).toBe('object')
    expect(self.properties).toHaveProperty('self')
  })

  it('leaves a dangling/foreign $ref untouched instead of throwing', () => {
    const dangling = resolveRef(sampleSpec, { $ref: '#/components/schemas/DoesNotExist' })
    expect(dangling).toEqual({ $ref: '#/components/schemas/DoesNotExist' })
    const foreign = resolveRef(sampleSpec, { $ref: 'https://other/spec#/X' })
    expect(foreign.$ref).toBe('https://other/spec#/X')
  })
})

describe('openapi-drift-engine — describeFields (yup → field list)', () => {
  it('extracts top-level fields with yup types from a real contract schema', () => {
    const fields = describeFields(contractSchemas.networkList.versionResponse)
    const byName = Object.fromEntries(fields.map((field) => [field.name, field]))
    expect(byName.name.type).toBe('string')
    expect(byName.type.type).toBe('string')
    expect(byName.items.type).toBe('array')
    expect(byName.version.type).toBe('number')
    expect(byName.version.nullable).toBe(true)
  })
})

describe('openapi-drift-engine — type compatibility', () => {
  it('maps yup primitives onto compatible OpenAPI types', () => {
    expect(isTypeCompatible('string', 'string')).toBe(true)
    expect(isTypeCompatible('number', 'integer')).toBe(true)
    expect(isTypeCompatible('number', 'number')).toBe(true)
    expect(isTypeCompatible('boolean', 'string')).toBe(false)
    expect(isTypeCompatible('array', 'object')).toBe(false)
  })

  it('treats yup mixed (any) as compatible with everything', () => {
    for (const openApiType of Object.values(YUP_TO_OPENAPI).flat()) {
      expect(isTypeCompatible('mixed', openApiType)).toBe(true)
    }
  })
})

describe('openapi-drift-engine — path discovery', () => {
  it('finds the list and detail version endpoints for a present resource', () => {
    const paths = findVersionPaths(sampleSpec, 'applications')
    expect(paths.list).toBe('/v4/workspace/applications/{id}/versions')
    expect(paths.detail).toBe('/v4/workspace/applications/{id}/versions/{versionId}')
  })

  it('returns nulls for a resource with no version endpoints (drives the FAIL path)', () => {
    const paths = findVersionPaths(sampleSpec, 'wafs')
    expect(paths.list).toBeNull()
    expect(paths.detail).toBeNull()
  })
})

describe('openapi-drift-engine — envelope detection', () => {
  it('unwraps a `data` envelope (application detail GET)', () => {
    const { itemSchema, envelope } = detailItem('applications')
    expect(envelope).toEqual(['data'])
    expect(itemSchema.properties).toHaveProperty('version_id')
  })

  it('unwraps a `results` array envelope (network_list list GET)', () => {
    const { list } = findVersionPaths(sampleSpec, 'network_lists')
    const schema = getResponseSchema(sampleSpec, sampleSpec.paths[list], 'get')
    const { itemSchema, envelope } = unwrapToItemSchema(sampleSpec, schema)
    expect(envelope).toEqual(['results'])
    expect(itemSchema.properties).toHaveProperty('items')
  })
})

describe('openapi-drift-engine — response-side drift (the core)', () => {
  it('passes fields that are present with a compatible type (incl. nested $ref)', () => {
    const { itemSchema } = detailItem('applications')
    const ourFields = [
      { name: 'name', type: 'string' },
      { name: 'modules', type: 'object' }
    ]
    expect(compareResponseFields(ourFields, itemSchema, sampleSpec)).toEqual([])
  })

  it('flags a field whose spec type is incompatible (active: boolean vs string)', () => {
    const { itemSchema } = detailItem('applications')
    const issues = compareResponseFields(
      [{ name: 'active', type: 'boolean' }],
      itemSchema,
      sampleSpec
    )
    expect(issues).toEqual([{ field: 'active', expected: 'boolean', spec: 'string', kind: 'type' }])
  })

  it('flags a field absent from the published schema (debug)', () => {
    const { itemSchema } = detailItem('applications')
    const issues = compareResponseFields(
      [{ name: 'debug', type: 'boolean' }],
      itemSchema,
      sampleSpec
    )
    expect(issues).toEqual([
      { field: 'debug', expected: 'boolean', spec: 'absent', kind: 'missing' }
    ])
  })

  it('reports every drifting field at once for the application version schema', () => {
    const { itemSchema } = detailItem('applications')
    const ourFields = [
      { name: 'name', type: 'string' },
      { name: 'active', type: 'boolean' },
      { name: 'debug', type: 'boolean' },
      { name: 'modules', type: 'object' }
    ]
    const issues = compareResponseFields(ourFields, itemSchema, sampleSpec)
    expect(issues.map((issue) => `${issue.field}:${issue.kind}`).sort()).toEqual([
      'active:type',
      'debug:missing'
    ])
  })

  it('the network_list version schema is drift-free for the fields the front reads', () => {
    const { itemSchema } = detailItem('network_lists')
    const ourFields = [
      { name: 'name', type: 'string' },
      { name: 'type', type: 'string' },
      { name: 'items', type: 'array' }
    ]
    expect(compareResponseFields(ourFields, itemSchema, sampleSpec)).toEqual([])
  })

  it('treats an untyped/composed spec node as non-contradicting (no false failure)', () => {
    const composed = { properties: { thing: { allOf: [{ $ref: '#/nope' }] } } }
    expect(
      compareResponseFields([{ name: 'thing', type: 'string' }], composed, sampleSpec)
    ).toEqual([])
  })
})

describe('openapi-drift-engine — request-side drift (lighter)', () => {
  it('FAILS on a missing field when the request forbids extras (additionalProperties: false)', () => {
    const post = getRequestBodySchema(
      sampleSpec,
      sampleSpec.paths['/v4/workspace/applications/{id}/versions'],
      'post'
    )
    const ourFields = [
      { name: 'comment' },
      { name: 'name' },
      { name: 'active' },
      { name: 'source_version' }
    ]
    const { issues, warnings, resolvable } = compareRequestFields(ourFields, post, sampleSpec)
    expect(resolvable).toBe(true)
    expect(issues.map((issue) => issue.field).sort()).toEqual(['active', 'source_version'])
    expect(warnings).toEqual([])
  })

  it('only WARNS on a missing field when extras are allowed (additionalProperties default)', () => {
    const post = getRequestBodySchema(
      sampleSpec,
      sampleSpec.paths['/v4/workspace/network_lists/{id}/versions'],
      'post'
    )
    const ourFields = [{ name: 'name' }, { name: 'items' }, { name: 'source_version' }]
    const { issues, warnings } = compareRequestFields(ourFields, post, sampleSpec)
    expect(issues).toEqual([])
    expect(warnings.map((warning) => warning.field).sort()).toEqual(['items', 'source_version'])
  })

  it('reports unresolvable when there is no request body to compare', () => {
    const result = compareRequestFields([{ name: 'x' }], null, sampleSpec)
    expect(result).toEqual({ issues: [], warnings: [], resolvable: false })
  })

  it('derives request fields from a real draft schema via describeFields', () => {
    const fields = describeFields(contractSchemas.application.draftRequest).map(
      (field) => field.name
    )
    expect(fields).toEqual(expect.arrayContaining(['comment', 'source_version', 'name', 'active']))
  })
})

describe('applyKnownDrift (known-drift allowlist)', () => {
  const issues = [
    { field: 'state', kind: 'missing', expected: 'string', spec: 'absent' },
    { field: 'name', kind: 'type', expected: 'string', spec: 'number' },
    { field: 'items', kind: 'missing-strict' }
  ]

  it('accepts issues matched by resource + kind + field and keeps the rest failing', () => {
    const allowlist = {
      entries: [{ resources: ['application'], kind: 'missing', fields: ['state'], reason: 'r1' }]
    }
    const { failures, accepted } = applyKnownDrift(issues, allowlist, 'application')
    expect(accepted).toEqual([{ ...issues[0], reason: 'r1' }])
    expect(failures).toEqual([issues[1], issues[2]])
  })

  it('supports the * wildcard on resources but NEVER on fields (wildcard fields are inert)', () => {
    // A fields:["*"] entry once neutralized the entire request-side drift
    // check — the engine now only matches EXPLICIT field names.
    const wildcardFields = {
      entries: [{ resources: ['*'], kind: 'missing-strict', fields: ['*'], reason: 'r2' }]
    }
    const wildcardResult = applyKnownDrift(issues, wildcardFields, 'network_list')
    expect(wildcardResult.accepted).toEqual([])
    expect(wildcardResult.failures).toHaveLength(3)

    const explicitFields = {
      entries: [
        { resources: ['*'], kind: 'missing-strict', fields: [issues[2].field], reason: 'r2' }
      ]
    }
    const { failures, accepted, used } = applyKnownDrift(issues, explicitFields, 'network_list')
    expect(accepted).toEqual([{ ...issues[2], reason: 'r2' }])
    expect(failures).toHaveLength(2)
    expect(used).toEqual([{ entryIndex: 0, field: issues[2].field, resource: 'network_list' }])
  })

  it('findStaleKnownDrift reports (entry, field) pairs that accepted nothing', () => {
    const allowlist = {
      entries: [
        { resources: ['waf'], kind: 'missing', fields: ['state', 'ghost_field'], reason: 'r1' }
      ]
    }
    const stale = findStaleKnownDrift(allowlist, [
      { entryIndex: 0, field: 'state', resource: 'waf' }
    ])
    expect(stale).toEqual([{ entryIndex: 0, field: 'ghost_field', reason: 'r1' }])
    expect(findStaleKnownDrift(allowlist, [])).toHaveLength(2)
  })

  it('does not accept when kind differs and passes everything through with no allowlist', () => {
    const byKind = applyKnownDrift(
      issues,
      { entries: [{ resources: ['*'], kind: 'missing', fields: ['name'] }] },
      'waf'
    )
    expect(byKind.accepted).toEqual([])
    expect(byKind.failures).toHaveLength(3)
    expect(applyKnownDrift(issues, null, 'waf').failures).toHaveLength(3)
  })
})

describe('unwrapToItemSchema — polymorphic composition (oneOf/anyOf/allOf)', () => {
  it('merges union member properties so a field present in ANY member counts', () => {
    const spec = {
      components: {
        schemas: {
          Http: {
            type: 'object',
            properties: { name: { type: 'string' }, host: { type: 'string' } }
          },
          Storage: {
            type: 'object',
            properties: { name: { type: 'string' }, bucket: { type: 'string' } }
          }
        }
      }
    }
    const node = {
      oneOf: [{ $ref: '#/components/schemas/Http' }, { $ref: '#/components/schemas/Storage' }]
    }
    const { itemSchema } = unwrapToItemSchema(spec, node)
    expect(itemSchema).toBeTruthy()
    expect(Object.keys(itemSchema.properties).sort()).toEqual(['bucket', 'host', 'name'])
  })
})
