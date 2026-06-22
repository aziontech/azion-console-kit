import { describe, it, expect } from 'vitest'
import { EdgeFunctionVersionAdapter } from '@/services/v2/edge-function/edge-function-version-adapter'

// Full version snapshot as returned by GET .../versions/{vid} using the legacy
// serializer keys (language/runtime_environment/json_args) that must be coalesced.
const rawSnapshot = (overrides = {}) => ({
  version_id: 'AVFN002',
  state: 'draft',
  name: 'my-fn',
  active: true,
  code: 'export default {}',
  language: 'javascript',
  runtime_environment: 'application',
  json_args: { foo: 'bar' },
  azion_form: { fields: [] },
  ...overrides
})

describe('EdgeFunctionVersionAdapter.transformListVersions', () => {
  it('normalizes a bare array into { count, body } with the shared UI shape', () => {
    const raw = [
      {
        id: 80001,
        version_id: 'AVFN001',
        version: 1,
        state: 'ready',
        last_editor: 'user@azion.com',
        created_at: '2026-06-16T10:30:00Z',
        ready_at: '2026-06-16T10:35:00Z',
        description: 'first'
      }
    ]

    const { count, body } = EdgeFunctionVersionAdapter.transformListVersions(raw)

    expect(count).toBe(1)
    expect(body[0]).toMatchObject({
      id: 'AVFN001',
      state: 'ready',
      version: 1,
      comment: 'first',
      createdAt: '2026-06-16T10:30:00Z',
      lastEditor: 'user@azion.com'
    })
  })

  it('accepts paginated { results, count } and { data } envelopes, and empty input', () => {
    expect(EdgeFunctionVersionAdapter.transformListVersions({ results: [], count: 0 })).toEqual({
      count: 0,
      body: []
    })
    expect(EdgeFunctionVersionAdapter.transformListVersions({ data: [] })).toEqual({
      count: 0,
      body: []
    })
    expect(EdgeFunctionVersionAdapter.transformListVersions(null)).toEqual({ count: 0, body: [] })
  })
})

describe('EdgeFunctionVersionAdapter.transformLoadVersion — config extraction', () => {
  it('extracts the full Function config, coalescing legacy serializer keys', () => {
    const result = EdgeFunctionVersionAdapter.transformLoadVersion(rawSnapshot())

    expect(result.id).toBe('AVFN002')
    expect(result.state).toBe('draft')
    expect(result.config).toMatchObject({
      name: 'my-fn',
      active: true,
      code: 'export default {}',
      runtime: 'azion_js',
      executionEnvironment: 'application',
      azionForm: { fields: [] }
    })
    // default_args is serialized into a JSON string for the form editor.
    expect(result.config.defaultArgs).toBe(JSON.stringify({ foo: 'bar' }, null, 2))
  })

  it('prefers canonical keys over legacy ones and maps runtime to the UI value', () => {
    const result = EdgeFunctionVersionAdapter.transformLoadVersion(
      rawSnapshot({
        runtime: 'lua',
        language: 'javascript',
        execution_environment: 'firewall',
        runtime_environment: 'application',
        default_args: { canonical: 1 },
        json_args: { legacy: 2 }
      })
    )

    expect(result.config.runtime).toBe('azion_lua')
    expect(result.config.executionEnvironment).toBe('firewall')
    expect(result.config.defaultArgs).toBe(JSON.stringify({ canonical: 1 }, null, 2))
  })

  it('returns config={} for a metadata-only payload (form falls back to parent)', () => {
    const result = EdgeFunctionVersionAdapter.transformLoadVersion({
      version_id: 'AVFN003',
      state: 'ready'
    })

    expect(result.id).toBe('AVFN003')
    expect(result.config).toEqual({})
  })

  it('extracts a partial config, omitting absent fields', () => {
    const result = EdgeFunctionVersionAdapter.transformLoadVersion({
      version_id: 'AVFN005',
      state: 'draft',
      name: 'partial',
      code: 'const x = 1'
    })

    expect(result.config).toEqual({ name: 'partial', code: 'const x = 1' })
    expect(result.config).not.toHaveProperty('runtime')
    expect(result.config).not.toHaveProperty('defaultArgs')
  })

  it('unwraps a { data } envelope', () => {
    const result = EdgeFunctionVersionAdapter.transformLoadVersion({
      data: { version_id: 'AVFN004', state: 'draft' }
    })
    expect(result.id).toBe('AVFN004')
  })
})

describe('EdgeFunctionVersionAdapter payload transforms', () => {
  // The form's `runtime` field carries the language code (`javascript`/`lua`),
  // which `transformPayloadEdgeFunctions` maps to the API value (`azion_js`/`azion_lua`).
  const uiForm = {
    name: 'edited-fn',
    active: false,
    code: 'export default { ok: true }',
    runtime: 'javascript',
    executionEnvironment: 'application',
    defaultArgs: JSON.stringify({ key: 'value' }),
    azionForm: { fields: [] }
  }

  it('transformDraftPayload maps the form to a root snake_case payload (PUT)', () => {
    const payload = EdgeFunctionVersionAdapter.transformDraftPayload(uiForm)

    expect(payload).toMatchObject({
      name: 'edited-fn',
      active: false,
      code: 'export default { ok: true }',
      runtime: 'azion_js',
      execution_environment: 'application',
      default_args: { key: 'value' },
      azion_form: { fields: [] }
    })
  })

  it('transformCreateDraftPayload maps sourceVersionId/comment and resource fields', () => {
    const payload = EdgeFunctionVersionAdapter.transformCreateDraftPayload({
      sourceVersionId: 'AVFN001',
      comment: 'clone',
      ...uiForm
    })

    expect(payload).toMatchObject({
      source_version: 'AVFN001',
      comment: 'clone',
      name: 'edited-fn',
      runtime: 'azion_js',
      execution_environment: 'application'
    })
  })

  it('transformCreateDraftPayload of a bare clone omits resource fields', () => {
    const payload = EdgeFunctionVersionAdapter.transformCreateDraftPayload({
      sourceVersionId: 'AVFN001'
    })
    expect(payload).toEqual({ source_version: 'AVFN001' })
  })

  it('strips undefined fields from the payload (no key when the form omits it)', () => {
    const payload = EdgeFunctionVersionAdapter.transformDraftPayload({
      name: 'only-name',
      code: 'x',
      runtime: 'javascript',
      executionEnvironment: undefined,
      azionForm: undefined
    })

    expect(payload).toHaveProperty('name', 'only-name')
    expect(payload).toHaveProperty('runtime', 'azion_js')
    expect(payload).not.toHaveProperty('execution_environment')
    expect(payload).not.toHaveProperty('azion_form')
  })

  it('transformArchivePayload returns { comment }', () => {
    expect(EdgeFunctionVersionAdapter.transformArchivePayload({ comment: 'bye' })).toEqual({
      comment: 'bye'
    })
  })

  it('transformBuildPayload only includes present keys', () => {
    expect(EdgeFunctionVersionAdapter.transformBuildPayload({})).toEqual({})
    expect(
      EdgeFunctionVersionAdapter.transformBuildPayload({ comment: 'go', trace_id: 't1' })
    ).toEqual({ comment: 'go', trace_id: 't1' })
  })
})
