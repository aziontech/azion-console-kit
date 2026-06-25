import { describe, it, expect } from 'vitest'
import { createVersionAdapter } from '@/services/v2/versioning/version-adapter'

/**
 * Task 5.5 — `referenceCount` is normalized by the SHARED adapter factory so
 * every resource inherits it without a fork. It is INFORMATIVE only: present
 * when the API exposes `reference_count` (e.g. Edge Function), `null` when the
 * API omits it (Network List / WAF). `meta.reference_count` wins over the flat
 * key, mirroring the precedence of the other version fields (Req 3.3, 5.2).
 */

const adapter = createVersionAdapter()

describe('createVersionAdapter — referenceCount normalization', () => {
  it('reads reference_count from the flat payload', () => {
    const version = adapter.normalizeVersion({ version_id: 'v1', reference_count: 3 })
    expect(version.referenceCount).toBe(3)
  })

  it('reads reference_count from meta with precedence over the flat key', () => {
    const version = adapter.normalizeVersion({
      version_id: 'v1',
      reference_count: 1,
      meta: { version_id: 'v1', reference_count: 9 }
    })
    expect(version.referenceCount).toBe(9)
  })

  it('falls back to null when the API omits the count (Network List / WAF)', () => {
    const version = adapter.normalizeVersion({ version_id: 'v1' })
    expect(version.referenceCount).toBeNull()
  })

  it('keeps a real zero count instead of coercing it to null', () => {
    const version = adapter.normalizeVersion({ version_id: 'v1', reference_count: 0 })
    expect(version.referenceCount).toBe(0)
  })

  it('carries referenceCount through transformListVersions for every row', () => {
    const { body } = adapter.transformListVersions([
      { version_id: 'v1', reference_count: 2 },
      { version_id: 'v2' }
    ])
    expect(body.map((entry) => entry.referenceCount)).toEqual([2, null])
  })

  it('carries referenceCount through transformLoadVersion (data envelope)', () => {
    const version = adapter.transformLoadVersion({ data: { version_id: 'v1', reference_count: 5 } })
    expect(version.referenceCount).toBe(5)
  })
})
