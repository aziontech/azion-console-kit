import { describe, expect, it } from 'vitest'
import { RESOURCE_TEST_REGISTRY } from '@/tests/support/versioning/registry'
import { describeVersionServiceContract } from '@/tests/shared/versioning/version-service.contract'
import { describeVersionAdapterContract } from '@/tests/shared/versioning/version-adapter.contract'

const edgeFunction = RESOURCE_TEST_REGISTRY.function
const adapter = edgeFunction.adapter

describeVersionServiceContract(edgeFunction)
describeVersionAdapterContract(edgeFunction)

const rawSnapshot = (overrides = {}) => ({
  version_id: 'AVFN002',
  state: 'draft',
  name: 'my-fn',
  active: true,
  code: 'export default {}',
  ...overrides
})

describe('edge-function — bespoke: alias coalescence and runtime mapping', () => {
  it('prefers canonical keys over legacy ones and maps runtime lua → azion_lua', () => {
    const result = adapter.transformLoadVersion(
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

  it('coalesces the legacy serializer keys when the canonical ones are absent', () => {
    const result = adapter.transformLoadVersion(
      rawSnapshot({
        language: 'javascript',
        runtime_environment: 'application',
        json_args: { foo: 'bar' }
      })
    )

    expect(result.config.runtime).toBe('azion_js')
    expect(result.config.executionEnvironment).toBe('application')
    expect(result.config.defaultArgs).toBe(JSON.stringify({ foo: 'bar' }, null, 2))
  })

  it('extracts a partial config, omitting absent fields', () => {
    const result = adapter.transformLoadVersion({
      version_id: 'AVFN005',
      state: 'draft',
      name: 'partial',
      code: 'const x = 1'
    })

    expect(result.config).toEqual({ name: 'partial', code: 'const x = 1' })
    expect(result.config).not.toHaveProperty('runtime')
    expect(result.config).not.toHaveProperty('defaultArgs')
  })

  it('transformDraftPayload parses default_args back into an object for the wire', () => {
    const payload = adapter.transformDraftPayload({
      name: 'edited-fn',
      code: 'x',
      runtime: 'lua',
      executionEnvironment: 'application',
      defaultArgs: JSON.stringify({ key: 'value' })
    })

    expect(payload).toMatchObject({ name: 'edited-fn', runtime: 'azion_lua' })
    expect(payload.default_args).toEqual({ key: 'value' })
  })
})
