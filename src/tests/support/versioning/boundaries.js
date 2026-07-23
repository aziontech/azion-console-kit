import { vi } from 'vitest'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient } from '@/services/v2/base/query/queryClient'

/**
 * @returns {{
 * spy: import('vitest').MockInstance,
 * respondWith: (data: unknown) => import('vitest').MockInstance,
 * resolveNext: (response: unknown) => import('vitest').MockInstance,
 * rejectNext: (error: unknown) => import('vitest').MockInstance
 * }}
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
 * @param {object} service
 * @returns {{
 * useQuery: import('vitest').MockInstance,
 * removeQueries: import('vitest').MockInstance,
 * invalidateQueries: import('vitest').MockInstance,
 * ensureQueryData: import('vitest').MockInstance
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

export const restoreBoundaries = () => {
  vi.restoreAllMocks()
}

/**
 * Routes BOTH HTTP boundaries (httpService for v2, AxiosHttpClientAdapter for
 * v1) by URL fragment — the canonical seam for tests that traverse MANY
 * services at once (whole views in browser mode, legacy smokes). Unmatched
 * requests get an empty-but-shaped answer so ancillary calls never crash the
 * test (spec test-effectiveness, req 9.2 — formalized from the composer smoke
 * and legacy-smoke copies; the M5 spec decides the future network tool).
 *
 * @param {Array<[string, unknown]>|Record<string, unknown>} routes
 *   fragment → answer. By default the answer is the DATA payload and the
 *   seam-specific envelope is applied; with `raw: true` the answer is used
 *   as the full seam response verbatim (legacy-smoke style).
 * @returns {Array<object>} every request config that crossed either seam
 */
export const routeHttpByUrl = (routes = {}, { raw = false } = {}) => {
  const entries = Array.isArray(routes) ? routes : Object.entries(routes)
  const calls = []
  const answerFor = (url) => {
    const match = entries.find(([fragment]) => url.includes(fragment))
    return match ? match[1] : undefined
  }

  vi.spyOn(httpService, 'request').mockImplementation(async (request) => {
    calls.push(request)
    const answer = answerFor(request.url)
    if (raw) return answer ?? { data: { results: [], count: 0 } }
    return { data: answer ?? { results: [], count: 0 }, status: 200 }
  })
  vi.spyOn(AxiosHttpClientAdapter, 'request').mockImplementation(async (request) => {
    calls.push(request)
    const answer = answerFor(request.url)
    if (raw) return answer ?? { statusCode: 200, body: { results: [], count: 0 } }
    return { statusCode: 200, body: answer ?? { results: [], count: 0 } }
  })

  return calls
}
