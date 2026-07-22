import { describe, it, expect, vi } from 'vitest'
import { createReleaseImpactLookupService } from '@/services/v2/release-impact/release-impact-lookup-service'
import {
  v6WorkloadsList,
  legacyWorkloadsList,
  environmentsList,
  makeWorkload,
  makeBinding,
  asListResponse
} from './harness'

const queryStub = (response) => ({ suspense: () => Promise.resolve(response) })

const makeServices = ({ firstPage, environments = environmentsList, pages = {} } = {}) => {
  const useWorkloadsListQuery = vi.fn(() => queryStub(firstPage))
  const useEnvironmentsListQuery = vi.fn(() => queryStub(environments))
  const listWorkloads = vi.fn(({ page }) => Promise.resolve(pages[page] ?? asListResponse([])))

  return {
    workloadService: { useWorkloadsListQuery, listWorkloads },
    environmentService: { useEnvironmentsListQuery },
    spies: { useWorkloadsListQuery, useEnvironmentsListQuery, listWorkloads }
  }
}

const pageOf = (size, dsPrefix) =>
  asListResponse(
    Array.from({ length: size }, (unused, position) =>
      makeWorkload({
        id: `${dsPrefix}-wl-${position}`,
        activeContent: 'Active',
        bindings: [
          makeBinding({
            deployment_id: `${dsPrefix}-${position}`,
            environment_id: 'env-prod',
            domains: [`${dsPrefix}-${position}.example.com`]
          })
        ]
      })
    )
  )

describe('releaseImpactLookupService.getReverseLookup', () => {
  it('inverts a single-page v6 list into the per-DS index and resolves env names', async () => {
    const { workloadService, environmentService } = makeServices({ firstPage: v6WorkloadsList })
    const service = createReleaseImpactLookupService({ workloadService, environmentService })

    const { index, isPartial } = await service.getReverseLookup({ enabled: true })

    expect(isPartial).toBe(false)
    expect(index['ds-1'].map((row) => row.id)).toEqual(['wl-1', 'wl-2'])
    expect(index['ds-1'][0].environmentName).toBe('Production')
    expect(index['ds-3'][0].environmentName).toBe(null)
  })

  it('does not page when count <= one page (no imperative listWorkloads call)', async () => {
    const { workloadService, environmentService, spies } = makeServices({
      firstPage: v6WorkloadsList
    })
    const service = createReleaseImpactLookupService({ workloadService, environmentService })

    await service.getReverseLookup({ enabled: true })

    expect(spies.listWorkloads).not.toHaveBeenCalled()
  })

  it('fans out remaining pages via the cached imperative listWorkloads when count > 100', async () => {
    const firstPage = { body: pageOf(100, 'p1').body, count: 150 }
    const { workloadService, environmentService, spies } = makeServices({
      firstPage,
      pages: { 2: pageOf(50, 'p2') }
    })
    const service = createReleaseImpactLookupService({ workloadService, environmentService })

    const { index, isPartial } = await service.getReverseLookup({ enabled: true })

    expect(spies.listWorkloads).toHaveBeenCalledTimes(1)
    expect(spies.listWorkloads).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, pageSize: 100 })
    )
    expect(Object.keys(index)).toHaveLength(150)
    expect(isPartial).toBe(false)
  })

  it('marks isPartial when the hard page cap truncates the fan-out', async () => {
    const firstPage = { body: pageOf(100, 'p1').body, count: 100 * 100 * 2 }
    const { workloadService, environmentService } = makeServices({
      firstPage,
      pages: {}
    })
    const service = createReleaseImpactLookupService({ workloadService, environmentService })

    const { isPartial } = await service.getReverseLookup({ enabled: true })

    expect(isPartial).toBe(true)
  })

  it('marks isPartial when any fan-out page fails (independent fan-out)', async () => {
    const firstPage = { body: pageOf(100, 'p1').body, count: 200 }
    const useWorkloadsListQuery = vi.fn(() => queryStub(firstPage))
    const useEnvironmentsListQuery = vi.fn(() => queryStub(environmentsList))
    const listWorkloads = vi.fn(() => Promise.reject(new Error('boom')))
    const service = createReleaseImpactLookupService({
      workloadService: { useWorkloadsListQuery, listWorkloads },
      environmentService: { useEnvironmentsListQuery }
    })

    const { index, isPartial } = await service.getReverseLookup({ enabled: true })

    expect(isPartial).toBe(true)
    expect(Object.keys(index)).toHaveLength(100)
  })

  it('yields an empty index for a legacy tenant (drives degradation downstream)', async () => {
    const { workloadService, environmentService } = makeServices({ firstPage: legacyWorkloadsList })
    const service = createReleaseImpactLookupService({ workloadService, environmentService })

    const { index, isPartial } = await service.getReverseLookup({ enabled: true })

    expect(index).toEqual({})
    expect(isPartial).toBe(false)
  })

  it('uses only tenant services and forwards enabled to both list queries', async () => {
    const { workloadService, environmentService, spies } = makeServices({
      firstPage: v6WorkloadsList
    })
    const service = createReleaseImpactLookupService({ workloadService, environmentService })

    const enabled = true
    await service.getReverseLookup({ enabled })

    expect(spies.useWorkloadsListQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled,
        params: expect.objectContaining({ pageSize: 100 })
      })
    )
    expect(spies.useEnvironmentsListQuery).toHaveBeenCalledWith({ enabled })
  })

  it('never reaches a service-to-service reverse-lookup path (tenant-only, req 10.1/10.2)', async () => {
    const allowedTenantMethods = [
      'useWorkloadsListQuery',
      'listWorkloads',
      'useEnvironmentsListQuery'
    ]
    const calledMethods = []
    const trap = (name, impl) =>
      vi.fn((...args) => {
        calledMethods.push(name)
        return impl(...args)
      })

    const firstPage = { body: pageOf(100, 'p1').body, count: 200 }
    const workloadService = {
      useWorkloadsListQuery: trap('useWorkloadsListQuery', () => queryStub(firstPage)),
      listWorkloads: trap('listWorkloads', ({ page }) =>
        Promise.resolve(page === 2 ? pageOf(100, 'p2') : asListResponse([]))
      ),
      workloadsByDeployment: trap('workloadsByDeployment', () =>
        Promise.reject(new Error('s2s path must never be called'))
      )
    }
    const environmentService = {
      useEnvironmentsListQuery: trap('useEnvironmentsListQuery', () => queryStub(environmentsList))
    }

    const service = createReleaseImpactLookupService({ workloadService, environmentService })
    await service.getReverseLookup({ enabled: true })

    expect(workloadService.workloadsByDeployment).not.toHaveBeenCalled()
    expect(new Set(calledMethods)).toEqual(new Set(allowedTenantMethods))
  })
})
