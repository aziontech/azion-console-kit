import { vi } from 'vitest'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient } from '@/services/v2/base/query/queryClient'

/**
 * Test-kit — the ONE canonical boundary seam for version services.
 *
 * Before this module the same `vi.spyOn(httpService, 'request')` + `queryClient`
 * stubs were re-implemented in up to 19 files. Every version service test now
 * mocks ONLY these external boundaries (HTTP client + query cache); the
 * versioning code under test (services, adapters, base class) always runs for
 * real, satisfying the anti-placebo rule `no-versioning-module-mock`.
 */

/**
 * Spies the HTTP boundary (`httpService.request`) — the single seam every version
 * service crosses to reach the network. Returns the spy plus intent-revealing
 * helpers so a test reads as "respond with this payload", not "mockResolvedValue".
 *
 * @returns {{
 *   spy: import('vitest').MockInstance,
 *   respondWith: (data: unknown) => import('vitest').MockInstance,
 *   resolveNext: (response: unknown) => import('vitest').MockInstance,
 *   rejectNext: (error: unknown) => import('vitest').MockInstance
 * }}
 *   `respondWith(data)` resolves the next request with `{ data }` (the shape the
 *   service destructures); `resolveNext(response)` resolves with the full response
 *   object as-is; `rejectNext(error)` fails the next request.
 */
export const spyHttpRequest = () => {
  const spy = vi.spyOn(httpService, 'request')
  return {
    spy,
    respondWith: (data) => spy.mockResolvedValueOnce({ data }),
    resolveNext: (response) => spy.mockResolvedValueOnce(response),
    rejectNext: (error) => spy.mockRejectedValueOnce(error)
  }
}

/**
 * Stubs the query-cache seam a version service touches: the reactive `useQuery`
 * (stubbed to a pass-through so the real `queryFn` runs and can be awaited) and
 * the cache-invalidation methods on the shared `queryClient`. The versioning code
 * under test still executes; only the TanStack cache is neutralized.
 *
 * `useQuery` is stubbed to return `{ queryFn }`, letting a read test drive the real
 * fetch via `const { queryFn } = service.useListVersionsQuery(id); await queryFn()`
 * while asserting the query key `useQuery` was called with.
 *
 * @param {object} service version service instance (extends `VersionServiceBase`)
 * @returns {{
 *   useQuery: import('vitest').MockInstance,
 *   removeQueries: import('vitest').MockInstance,
 *   invalidateQueries: import('vitest').MockInstance,
 *   ensureQueryData: import('vitest').MockInstance
 * }}
 */
export const stubVersionQueryCache = (service) => {
  const useQuery = vi
    .spyOn(service, 'useQuery')
    .mockImplementation((_queryKey, queryFn) => ({ queryFn }))
  const removeQueries = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(() => {})
  const ensureQueryData = vi
    .spyOn(queryClient, 'ensureQueryData')
    .mockImplementation(({ queryFn } = {}) =>
      typeof queryFn === 'function' ? queryFn() : undefined
    )

  return { useQuery, removeQueries, invalidateQueries, ensureQueryData }
}

/**
 * Restores every spy installed by the kit (and any other `vi.spyOn`). Call in
 * `afterEach` so boundaries never leak across tests.
 */
export const restoreBoundaries = () => {
  vi.restoreAllMocks()
}
