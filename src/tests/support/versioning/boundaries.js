import { vi } from 'vitest'
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
