import { BaseService } from '@/services/v2/base/query/baseService'
import { PersonalTokenAdapter } from './personal-token-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { sortDate } from '@/utils/date-sort'

export class PersonalTokenService extends BaseService {
  constructor() {
    super()
    this.adapter = PersonalTokenAdapter
    this.baseURL = 'v4/iam/personal_tokens'
  }

  #fetchList = async ({ page = 1, pageSize = 200, search = '' } = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params: { page, pageSize, search }
    })

    const { results, count } = data

    const parsedTokens = await Promise.all(
      this.adapter?.transformListPersonalTokens?.(results) ?? results
    )

    return {
      count,
      body: sortDate(parsedTokens, 'createdDate')
    }
  }

  prefetchList = (pageSize = 200) => {
    const params = { page: 1, pageSize }

    return this.usePrefetchQuery(queryKeys.personalToken.list(params), () =>
      this.#fetchList(params)
    )
  }

  listPersonalTokensService = async (params) => {
    const firstPage = params?.page === 1
    const skipCache = params?.skipCache || params?.search || params?.hasFilter
    const queryParams = { page: params?.page, pageSize: params?.pageSize, search: params?.search }

    return await this.useEnsureQueryData(
      queryKeys.personalToken.list(queryParams),
      () => this.#fetchList(queryParams),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  createPersonalTokenService = async (payload) => {
    const { name, description, expiresAt } = payload

    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body: {
        name,
        description,
        expires_at: expiresAt
      }
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.personalToken.all })

    return {
      feedback: 'Personal token has been created',
      token: data.key,
      urlToEditView: '/personal-tokens'
    }
  }

  deletePersonalTokenService = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${id}`
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.personalToken.all })

    return 'Personal token successfully deleted'
  }
}

export const personalTokenService = new PersonalTokenService()
