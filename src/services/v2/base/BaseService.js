import { httpService } from './httpService'
import { useMutation } from '@tanstack/vue-query'
import { useAccountStore } from '@/stores/account'
import { enhancedQueryClient } from './queryClient'

export class BaseService {
  constructor() {
    if (this.constructor.instance) {
      return this.constructor.instance
    }

    this.http = httpService
    this.constructor.instance = this
  }

  // Build query key with user context
  buildQueryKey(key, isGlobal = false) {
    const accountStore = useAccountStore()
    const { user_id: accountId } = accountStore.accountData

    if (isGlobal) {
      return Array.isArray(key) ? ['global', ...key] : ['global', key]
    }

    const id = accountId || 'default'
    return Array.isArray(key) ? [id, ...key] : [id, key]
  }

  useQuery(key, queryFn, options = {}) {
    const queryKey = this.buildQueryKey(key, options.global)

    return enhancedQueryClient.useQuery({
      queryKey,
      queryFn,
      ...options
    })
  }

  useMutation(mutationFn, options = {}) {
    return useMutation({
      mutationFn,
      ...options
    })
  }

  useGlobalQuery(key, queryFn, options = {}) {
    return this.useQuery(key, queryFn, { ...options, global: true })
  }
}
