import { describe, expect, it } from 'vitest'
import { RESOURCE_TEST_REGISTRY } from '@/tests/support/versioning/registry'
import { describeVersionServiceContract } from '@/tests/shared/versioning/version-service.contract'
import { describeVersionAdapterContract } from '@/tests/shared/versioning/version-adapter.contract'

const application = RESOURCE_TEST_REGISTRY.application
const adapter = application.adapter

describeVersionServiceContract(application)
describeVersionAdapterContract(application)

describe('application — bespoke: module config extraction and mapping', () => {
  it('extracts name/active/debug and every module flag into the exact UI config', () => {
    const result = adapter.transformLoadVersion(application.buildVersion())

    expect(result.config).toEqual({
      name: 'my-app',
      edgeCacheEnabled: true,
      edgeFunctionsEnabled: false,
      applicationAcceleratorEnabled: true,
      imageProcessorEnabled: false,
      tieredCacheEnabled: true,
      isActive: true,
      debug: false
    })
  })

  it('extracts a partial config, omitting absent module flags and fields', () => {
    const result = adapter.transformLoadVersion({
      version_id: 'AVAPP0005',
      state: 'draft',
      name: 'partial',
      modules: { cache: { enabled: true } }
    })

    expect(result.config).toEqual({ name: 'partial', edgeCacheEnabled: true })
    expect(result.config).not.toHaveProperty('edgeFunctionsEnabled')
    expect(result.config).not.toHaveProperty('isActive')
    expect(result.config).not.toHaveProperty('debug')
  })

  it('transformCreateDraftPayload maps the full form back to the root modules shape', () => {
    const form = adapter.transformLoadVersion(application.buildVersion()).config
    const payload = adapter.transformCreateDraftPayload({
      sourceVersionId: 'AVAPP0000',
      comment: 'clone',
      ...form
    })

    expect(payload).toMatchObject({ name: 'my-app', active: true, debug: false })
    expect(payload.modules).toEqual({
      cache: { enabled: true },
      functions: { enabled: false },
      application_accelerator: { enabled: true },
      image_processor: { enabled: false },
      tiered_cache: { enabled: true }
    })
  })

  it('transformCreateDraftPayload of a bare clone omits every resource field', () => {
    const payload = adapter.transformCreateDraftPayload({ sourceVersionId: 'AVAPP0000' })

    expect(payload).toEqual({ source_version: 'AVAPP0000' })
  })
})
