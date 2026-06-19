import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { parse } from '@babel/parser'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { DeploymentReleaseService } from '@/services/v2/deployment/deployment-release-service'
import {
  isComposableImport,
  isStoreImport,
  isDomImport
} from '../../../../../eslint/plugin/lib/utils/import-resolver.js'

const DEPLOYMENT_ID = 'dep-123'

let service

const stubEnsureQueryData = () =>
  vi.spyOn(service, 'useEnsureQueryData').mockImplementation((_key, queryFn) => queryFn())

beforeEach(() => {
  service = new DeploymentReleaseService()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('DeploymentReleaseService - getActiveReleaseComposition', () => {
  it('reads ready releases and returns the one serving traffic (traffic_role === ACTIVE)', async () => {
    stubEnsureQueryData()
    const activeRelease = { id: 'rel-active', traffic_role: 'ACTIVE', resources: [] }
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({
      data: {
        results: [
          { id: 'rel-old', traffic_role: 'PREVIOUS' },
          activeRelease,
          { id: 'rel-candidate', traffic_role: 'CANDIDATE' }
        ]
      }
    })

    const result = await service.getActiveReleaseComposition(DEPLOYMENT_ID)

    expect(result).toBe(activeRelease)
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: `/deployment-api/v4/deployments/${DEPLOYMENT_ID}/releases`,
      params: { traffic_role: 'active' }
    })
  })

  it('keys the read with queryKeys.release.activeComposition for the target deployment', async () => {
    const ensureSpy = vi.spyOn(service, 'useEnsureQueryData').mockResolvedValueOnce(null)

    await service.getActiveReleaseComposition(DEPLOYMENT_ID)

    expect(ensureSpy).toHaveBeenCalledWith(
      queryKeys.release.activeComposition(DEPLOYMENT_ID),
      expect.any(Function)
    )
  })

  it('tolerates bare array, { results } and { data } envelopes', async () => {
    stubEnsureQueryData()
    const active = { id: 'a', traffic_role: 'ACTIVE' }

    vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: [active] })
    await expect(service.getActiveReleaseComposition(DEPLOYMENT_ID)).resolves.toBe(active)

    vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: { data: [active] } })
    await expect(service.getActiveReleaseComposition(DEPLOYMENT_ID)).resolves.toBe(active)
  })

  it('returns null when no ready release is serving traffic (never-deployed / removed)', async () => {
    stubEnsureQueryData()
    vi.spyOn(httpService, 'request').mockResolvedValueOnce({
      data: { results: [{ id: 'rel-old', traffic_role: 'PREVIOUS' }] }
    })

    await expect(service.getActiveReleaseComposition(DEPLOYMENT_ID)).resolves.toBeNull()
  })

  it('returns null when the release list is empty', async () => {
    stubEnsureQueryData()
    vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: { results: [] } })

    await expect(service.getActiveReleaseComposition(DEPLOYMENT_ID)).resolves.toBeNull()
  })

  it('is read-only: never writes to the cache while reading the composition', async () => {
    stubEnsureQueryData()
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(() => {})
    vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: { results: [] } })

    await service.getActiveReleaseComposition(DEPLOYMENT_ID)

    expect(removeSpy).not.toHaveBeenCalled()
    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})

describe('DeploymentReleaseService - buildAndActivate (P3, P6)', () => {
  const payload = {
    resources: [{ resource_id: 1, resource_version: 'v', resource_type: 'application' }]
  }

  it('POSTs to build_and_activate and unwraps the response (data.data ?? data)', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: { data: { id: 'new-release' } } })

    const result = await service.buildAndActivate(DEPLOYMENT_ID, payload)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `/deployment-api/v4/deployments/${DEPLOYMENT_ID}/build_and_activate`,
      body: payload
    })
    expect(result).toEqual({ data: { id: 'new-release' } })
    expect(removeSpy).toHaveBeenCalled()
  })

  it('P6: clears the drawer caches and invalidates the releases/deployments caches on success', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(() => {})
    vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: { id: 'x' } })

    await service.buildAndActivate(DEPLOYMENT_ID, payload)

    // Drawer caches (active-release composition + history) are removed outright.
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: queryKeys.deployments.history.all })
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: queryKeys.release.all(DEPLOYMENT_ID) })
    // Releases CRUD + deployments caches are invalidated (theirs namespace).
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.deployments.releases.all(DEPLOYMENT_ID)
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.deployments.all })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.deployments.detail(DEPLOYMENT_ID)
    })
  })

  it('P6: never touches the cache when the API errors, preserving the error code/detail', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(() => {})
    const apiError = { statusCode: 422, body: { detail: 'invalid resource version' } }
    vi.spyOn(httpService, 'request').mockRejectedValueOnce(apiError)

    await expect(service.buildAndActivate(DEPLOYMENT_ID, payload)).rejects.toBe(apiError)

    expect(removeSpy).not.toHaveBeenCalled()
    expect(invalidateSpy).not.toHaveBeenCalled()
  })

  it('P3: dispatches a single request with no retry on failure', async () => {
    vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockRejectedValueOnce({ statusCode: 404, body: { detail: 'not found' } })

    await expect(service.buildAndActivate(DEPLOYMENT_ID, payload)).rejects.toMatchObject({
      statusCode: 404
    })
    expect(requestSpy).toHaveBeenCalledTimes(1)
  })
})

describe('P5: services-http-only - the service imports no composables/stores/DOM', () => {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const servicePath = resolve(
    __dirname,
    '../../../../services/v2/deployment/deployment-release-service.js'
  )

  const importSources = (() => {
    const code = readFileSync(servicePath, 'utf-8')
    const ast = parse(code, { sourceType: 'module', plugins: ['classProperties'] })
    return ast.program.body
      .filter((node) => node.type === 'ImportDeclaration')
      .map((node) => node.source.value)
  })()

  it('imports no composable modules', () => {
    const offenders = importSources.filter((source) => isComposableImport(source))
    expect(offenders).toEqual([])
  })

  it('imports no Pinia stores', () => {
    const offenders = importSources.filter((source) => isStoreImport(source))
    expect(offenders).toEqual([])
  })

  it('imports no DOM/router modules', () => {
    const offenders = importSources.filter((source) => isDomImport(source))
    expect(offenders).toEqual([])
  })
})
