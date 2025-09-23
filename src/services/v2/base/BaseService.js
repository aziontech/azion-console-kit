import { httpService } from './http/httpService'
import { simpleQueryClient } from './queryClient'

export class BaseService {
  constructor() {
    if (this.constructor.instance) {
      return this.constructor.instance
    }

    this.http = httpService
    this.queryClient = simpleQueryClient
    this.constructor.instance = this
  }

  useQuery(key, queryFn, options = {}) {
    return this.queryClient.useQuery({
      queryKey: key,
      queryFn,
      ...options
    })
  }

  useGlobalQuery(key, queryFn, options = {}) {
    return this.useQuery(key, queryFn, { ...options, global: true })
  }

  useSensitiveQuery(key, queryFn, options = {}) {
    return this.useQuery(key, queryFn, { ...options, sensitive: true })
  }

  async syncQuery(key, queryFn, options = {}) {
    return await this.queryClient.fetchQuery({
      queryKey: key,
      queryFn,
      ...options
    })
  }

  async syncGlobalQuery(key, queryFn, options = {}) {
    return await this.syncQuery(key, queryFn, { ...options, global: true })
  }

  async syncSensitiveQuery(key, queryFn, options = {}) {
    return await this.syncQuery(key, queryFn, { ...options, sensitive: true })
  }

  useMutation(mutationFn, options = {}) {
    const { invalidateQueries, ...restOptions } = options

    return this.queryClient.useMutation({
      mutationFn,
      onSuccess: (data, variables, context) => {
        if (invalidateQueries) {
          const patterns = Array.isArray(invalidateQueries)
            ? invalidateQueries
            : [invalidateQueries]

          patterns.forEach((pattern) => {
            this.queryClient.invalidateQueries(pattern)
          })
        }

        if (restOptions.onSuccess) {
          restOptions.onSuccess(data, variables, context)
        }
      },
      onError: (error, variables, context) => {
        if (restOptions.onError) {
          restOptions.onError(error, variables, context)
        }
      },
      ...restOptions
    })
  }

  async clearCache() {
    await this.queryClient.clearCache()
  }

  async clearSensitiveData() {
    await this.queryClient.clearSensitiveData()
  }
}
