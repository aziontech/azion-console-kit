/**
 * TanStack Query implementation for Account
 * Following v5 best practices with Query Key Factories and queryOptions pattern
 */

import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { httpService } from '@/services/v2/base/http/httpService'
import { QUERY_CONFIG } from '@/services/v2/base/query/config'
import { createCustomQueryKeyFactory } from '@/services/v2/base/query/queryKeyFactory'
import { getAccountTypeIcon, getAccountTypeName } from '@/helpers/account-type-name-mapping.js'

// =============================================================================
// QUERY KEY FACTORY
// Reatividade automática - aceita ref/computed sem precisar de unref()
// =============================================================================

export const accountKeys = createCustomQueryKeyFactory('account', {
  // Métodos customizados específicos da feature account
  info: () => ['account', 'info'],
  settings: () => ['account', 'settings'],
  contracts: () => ['account', 'contracts'],
  contract: (id) => ['account', 'contracts', id],
  users: () => ['account', 'users'],
  user: (id) => ['account', 'users', id]
})

// =============================================================================
// DATA ADAPTERS
// =============================================================================

function adaptAccountInfo(response) {
  if (!response) return response

  return {
    ...response,
    accountTypeIcon: getAccountTypeIcon(response.kind),
    accountTypeName: getAccountTypeName(response.kind)
  }
}

// =============================================================================
// QUERY OPTIONS
// =============================================================================

export const accountQueryOptions = {
  /**
   * Get account information
   * Dados de usuário com cache moderado
   */
  info: () => ({
    queryKey: accountKeys.info(),
    queryFn: async () => {
      const response = await httpService.request({
        method: 'GET',
        url: 'account/info',
        config: { baseURL: '/api' }
      })
      return adaptAccountInfo(response.data)
    },
    // Account info são dados de usuário
    ...QUERY_CONFIG.USER
  })
}

// =============================================================================
// COMPOSABLES
// =============================================================================

/**
 * Fetch account information
 * Automatically caches and manages user account data
 *
 * @param {Object} options - Additional query options
 * @returns {UseQueryResult}
 *
 * @example
 * const { data: account, isLoading } = useAccountInfo()
 *
 * @example
 * // Force fresh data
 * const { data } = useAccountInfo({ staleTime: 0 })
 */
export function useAccountInfo(options = {}) {
  return useQuery({
    ...accountQueryOptions.info(),
    ...options
  })
}

/**
 * Get query client for manual cache operations
 */
export function useAccountQueryClient() {
  return useQueryClient()
}

/**
 * Invalidate account info
 * Useful after account updates
 */
export function useInvalidateAccountInfo() {
  const queryClient = useAccountQueryClient()

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: accountKeys.info()
    })
  }
}

/**
 * Invalidate all account queries
 */
export function useInvalidateAllAccount() {
  const queryClient = useAccountQueryClient()

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: accountKeys.all
    })
  }
}

/**
 * Get cached account info without fetching
 * Returns undefined if not in cache
 */
export function useGetCachedAccountInfo() {
  const queryClient = useAccountQueryClient()

  return () => {
    return queryClient.getQueryData(accountKeys.info())
  }
}

/**
 * Set account info in cache manually
 * Useful after mutations that return updated account data
 */
export function useSetAccountInfoCache() {
  const queryClient = useAccountQueryClient()

  return (data) => {
    queryClient.setQueryData(accountKeys.info(), adaptAccountInfo(data))
  }
}
