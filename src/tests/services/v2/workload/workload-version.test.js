import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setFeatureFlags } from '@/composables/user-flag'
import { RESOURCE_TEST_REGISTRY } from '@/tests/support/versioning/registry'
import { describeVersionServiceContract } from '@/tests/shared/versioning/version-service.contract'
import { describeVersionAdapterContract } from '@/tests/shared/versioning/version-adapter.contract'

const workload = RESOURCE_TEST_REGISTRY.workload
const adapter = workload.adapter

beforeAll(() => {
  setFeatureFlags([])
})

afterAll(() => {
  setFeatureFlags([])
})

describeVersionServiceContract(workload)
describeVersionAdapterContract(workload)

describe('workload — bespoke: full-resource draft PUT (no source_version)', () => {
  it('emits the full workload payload at the root, carrying only comment (not source_version)', () => {
    const payload = adapter.transformDraftPayload({
      ...workload.buildFormValues(),
      comment: 'edit',
      sourceVersionId: 'PARENT1'
    })

    expect(payload).toMatchObject({ name: 'my-workload', active: true, comment: 'edit' })
    expect(payload).not.toHaveProperty('source_version')
  })

  it('a bare clone (no name/protocols) skips the create transform → comment only', () => {
    expect(adapter.transformDraftPayload({ comment: 'just a note' })).toEqual({
      comment: 'just a note'
    })
  })
})

describe('workload — bespoke: comment-only action / build / archive payloads', () => {
  it('rollback (transformActionPayload) carries only a present comment', () => {
    expect(adapter.transformActionPayload({ comment: 'revert' })).toEqual({ comment: 'revert' })
    expect(adapter.transformActionPayload({})).toEqual({})
  })

  it('build / archive carry only a present comment, else empty', () => {
    expect(adapter.transformBuildPayload({ comment: 'go' })).toEqual({ comment: 'go' })
    expect(adapter.transformBuildPayload({})).toEqual({})
    expect(adapter.transformArchivePayload({ comment: 'bye' })).toEqual({ comment: 'bye' })
    expect(adapter.transformArchivePayload({})).toEqual({})
  })
})

describe('workload — bespoke: normalized meta shape and config gating', () => {
  const EXPECTED_KEYS = [
    'id',
    'state',
    'version',
    'comment',
    'createdAt',
    'readyAt',
    'lastModified',
    'lastEditor',
    'sourceVersionId',
    'referenceCount',
    'deploymentId',
    'environmentId',
    'lastError',
    'config'
  ]

  it('exposes exactly the base meta keys + the workload meta fields + config', () => {
    const result = adapter.transformLoadVersion({
      version_id: 'AY2JRCD3',
      version: 1,
      state: 'ready',
      source_version_id: 'PARENT1',
      deployment_id: 'AXK29QMP',
      environment_id: 'BZ3KSDE4',
      last_error: 'build failed',
      created_at: '2026-06-16T10:30:00Z',
      ready_at: '2026-06-16T10:35:00Z',
      last_editor: 'user@azion.com',
      description: 'note'
    })

    expect(Object.keys(result).sort()).toEqual([...EXPECTED_KEYS].sort())
    expect(result.deploymentId).toBe('AXK29QMP')
    expect(result.environmentId).toBe('BZ3KSDE4')
    expect(result.lastError).toBe('build failed')
    expect(result.sourceVersionId).toBe('PARENT1')
  })

  it('returns config={} for a partial snapshot missing mtls (form falls back to parent)', () => {
    const result = adapter.transformLoadVersion({
      version_id: 'X',
      state: 'ready',
      protocols: { http: { https_ports: [443] } },
      tls: { minimum_version: 'tls_1_2' }
    })

    expect(result.config).toEqual({})
  })
})
