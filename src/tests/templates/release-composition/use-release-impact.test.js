import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { flushPromises } from '@vue/test-utils'

import {
  useReleaseImpact,
  DEGRADATION_REASON
} from '@/templates/release-composition/use-release-impact'

const fakeLookupService = (...results) => {
  const getReverseLookup = vi.fn()
  results.forEach((result) => getReverseLookup.mockResolvedValueOnce(result))
  getReverseLookup.mockResolvedValue({ index: {}, isPartial: false })
  return { getReverseLookup }
}

const row = (overrides = {}) => ({
  id: 'wl-1',
  name: 'Workload 1',
  domains: ['a.example.com'],
  environmentId: 'env-1',
  environmentName: 'Production',
  ...overrides
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useReleaseImpact - degradation reasons', () => {
  it("legacy tenant (empty index after a successful load) => degradationReason 'legacy_no_bindings'", async () => {
    const lookupService = fakeLookupService({ index: {}, isPartial: false })

    const { degradationReason, reverseLookupByDs, isLoading } = useReleaseImpact({ lookupService })
    await flushPromises()

    expect(reverseLookupByDs.value).toEqual({})
    expect(isLoading.value).toBe(false)
    expect(degradationReason.value).toBe(DEGRADATION_REASON.LEGACY_NO_BINDINGS)
    expect(degradationReason.value).toBe('legacy_no_bindings')
  })

  it('healthy v6 tenant (populated index, not capped) => no degradation reason', async () => {
    const lookupService = fakeLookupService({
      index: { 'ds-1': [row()] },
      isPartial: false
    })

    const { degradationReason, isPartial } = useReleaseImpact({ lookupService })
    await flushPromises()

    expect(degradationReason.value).toBeNull()
    expect(isPartial.value).toBe(false)
  })

  it("rejected lookup => degradationReason 'fetch_failed' with an empty index (never fabricated)", async () => {
    const lookupService = { getReverseLookup: vi.fn().mockRejectedValue(new Error('boom')) }

    const { degradationReason, reverseLookupByDs, isPartial } = useReleaseImpact({ lookupService })
    await flushPromises()

    expect(degradationReason.value).toBe(DEGRADATION_REASON.FETCH_FAILED)
    expect(reverseLookupByDs.value).toEqual({})
    expect(isPartial.value).toBe(false)
  })

  it("capped-but-populated result => degradationReason 'capped'", async () => {
    const lookupService = fakeLookupService({
      index: { 'ds-1': [row()] },
      isPartial: true
    })

    const { degradationReason, isPartial } = useReleaseImpact({ lookupService })
    await flushPromises()

    expect(degradationReason.value).toBe(DEGRADATION_REASON.CAPPED)
    expect(isPartial.value).toBe(true)
  })
})

describe('useReleaseImpact - dsMetaFor omits unknown fields', () => {
  it('omits everything for a DS absent from the resolved index', async () => {
    const lookupService = fakeLookupService({
      index: { 'ds-1': [row()] },
      isPartial: false
    })

    const { dsMetaFor } = useReleaseImpact({ lookupService })
    await flushPromises()

    expect(dsMetaFor('ds-absent')).toEqual({})
  })

  it('reports workloadsCount and lists BOTH environmentNames when the DS spans multiple environments', async () => {
    const lookupService = fakeLookupService({
      index: {
        'ds-1': [
          row({ id: 'wl-1', environmentId: 'env-1', environmentName: 'Production' }),
          row({ id: 'wl-2', environmentId: 'env-2', environmentName: 'Staging' })
        ]
      },
      isPartial: false
    })

    const { dsMetaFor } = useReleaseImpact({ lookupService })
    await flushPromises()

    const meta = dsMetaFor('ds-1')
    expect(meta).toEqual({ workloadsCount: 2, environmentNames: ['Production', 'Staging'] })
  })

  it('reports workloadsCount but OMITS environmentNames when the only name is unknown (null)', async () => {
    const lookupService = fakeLookupService({
      index: { 'ds-1': [row({ environmentName: null })] },
      isPartial: false
    })

    const { dsMetaFor } = useReleaseImpact({ lookupService })
    await flushPromises()

    const meta = dsMetaFor('ds-1')
    expect(meta).toEqual({ workloadsCount: 1 })
    expect('environmentNames' in meta).toBe(false)
  })

  it('includes environmentNames when the DS resolves to exactly one non-null env name', async () => {
    const lookupService = fakeLookupService({
      index: {
        'ds-1': [
          row({ id: 'wl-1', environmentName: 'Production' }),
          row({ id: 'wl-2', environmentName: 'Production' })
        ]
      },
      isPartial: false
    })

    const { dsMetaFor } = useReleaseImpact({ lookupService })
    await flushPromises()

    expect(dsMetaFor('ds-1')).toEqual({ workloadsCount: 2, environmentNames: ['Production'] })
  })
})

describe('useReleaseImpact - retry re-triggers the lookup', () => {
  it('re-invokes the lookup service and republishes the fresh index', async () => {
    const lookupService = {
      getReverseLookup: vi
        .fn()
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce({ index: { 'ds-1': [row()] }, isPartial: false })
    }

    const { degradationReason, reverseLookupByDs, retry } = useReleaseImpact({ lookupService })
    await flushPromises()

    expect(lookupService.getReverseLookup).toHaveBeenCalledTimes(1)
    expect(degradationReason.value).toBe(DEGRADATION_REASON.FETCH_FAILED)
    expect(reverseLookupByDs.value).toEqual({})

    await retry()

    expect(lookupService.getReverseLookup).toHaveBeenCalledTimes(2)
    expect(degradationReason.value).toBeNull()
    expect(reverseLookupByDs.value).toEqual({ 'ds-1': [row()] })
  })

  it('forwards the same `enabled` gate to the lookup service on every call', async () => {
    const enabled = ref(true)
    const lookupService = fakeLookupService(
      { index: {}, isPartial: false },
      { index: {}, isPartial: false }
    )

    const { retry } = useReleaseImpact({ lookupService, enabled })
    await flushPromises()
    await retry()

    expect(lookupService.getReverseLookup).toHaveBeenCalledTimes(2)
    for (const call of lookupService.getReverseLookup.mock.calls) {
      expect(call[0]).toEqual({ enabled })
    }
  })

  it('toggles isLoading around a retry', async () => {
    let resolveSecond
    const lookupService = {
      getReverseLookup: vi
        .fn()
        .mockResolvedValueOnce({ index: {}, isPartial: false })
        .mockReturnValueOnce(
          new Promise((resolve) => {
            resolveSecond = () => resolve({ index: { 'ds-1': [row()] }, isPartial: false })
          })
        )
    }

    const { isLoading, retry } = useReleaseImpact({ lookupService })
    await flushPromises()
    expect(isLoading.value).toBe(false)

    const pending = retry()
    expect(isLoading.value).toBe(true)

    resolveSecond()
    await pending
    expect(isLoading.value).toBe(false)
  })
})
