import { useQuery, useMutation } from '@tanstack/vue-query'
import { queryClient } from './queryClient'
import { useAccountStore } from '@/stores/account'

export class QueryService {
  constructor() {
    this.queryClient = queryClient
  }

  buildKey(key) {
    const { user_id: accountId } = useAccountStore().accountData

    const id = accountId || 'default'
    // eslint-disable-next-line no-console
    console.log('🚀 ~ QueryService ~ buildKey ~ accountId:', id)
    return Array.isArray(key) ? [id, ...key] : [id, key]
  }

  useQuery(key, queryFn, options = {}) {
    return useQuery({ queryKey: this.buildKey(key), queryFn, ...options })
  }

  useMutation(mutationFn, options = {}) {
    return useMutation(mutationFn, { ...options })
  }

  setDefaultOptions(options = {}) {
    this.defaultOptions = { ...this.defaultOptions, ...options }
  }

  invalidateCurrentAccount() {
    const accountStore = useAccountStore().accountData
    const accountId = accountStore.accountId
    this.queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] === accountId
    })
  }
}
