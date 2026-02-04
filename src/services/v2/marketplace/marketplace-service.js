import { MarketplaceAdapter } from './marketplace-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { getCacheOptions, CACHE_TYPE } from '@/services/v2/base/query/queryOptions'
import { waitForPersistenceRestore } from '@/services/v2/base/query/queryPlugin'

const ABORT_ID_LIST = 'marketplace-list'

export class MarketplaceService extends BaseService {
  #baseURL = 'marketplace/solution/'
  #categoriesURL = 'marketplace/categories/'

  fetchList = async (
    { category, search, type = 'marketplace' } = {},
    { signal, abortIdentifier } = {}
  ) => {
    const params = {
      ...(category && category !== 'all' && { category }),
      ...(search && { search })
    }

    const response = await this.http.request({
      method: 'GET',
      url: this.#baseURL,
      params,
      config: {
        baseURL: '/api',
        headers: { 'Mktp-Api-Context': type },
        ...(signal && { signal })
      },
      ...(!signal && abortIdentifier && { abortIdentifier })
    })

    const results = Array.isArray(response.data) ? response.data : (response.data?.results ?? [])
    return MarketplaceAdapter.transformList(results)
  }

  fetchListWithCache = async (params, { signal } = {}) => {
    await waitForPersistenceRestore()
    const persist = params.category === 'all' && !params.search
    const skipCache = !!params.search
    return this.queryClient.fetchQuery({
      queryKey: queryKeys.marketplace.list(params),
      queryFn: () => this.fetchList(params, { signal }),
      ...getCacheOptions(CACHE_TYPE.STATIC),
      meta: {
        persist,
        cacheType: CACHE_TYPE.STATIC,
        skipCache
      }
    })
  }

  fetchCategoriesWithCache = async ({ signal } = {}) => {
    await waitForPersistenceRestore()
    return this.queryClient.fetchQuery({
      queryKey: queryKeys.marketplace.categories(),
      queryFn: () => this.fetchCategories({ signal }),
      ...getCacheOptions(CACHE_TYPE.STATIC),
      meta: { persist: true, cacheType: CACHE_TYPE.STATIC, skipCache: false }
    })
  }

  fetchCategories = async (opts = {}) => {
    const { signal } = opts
    const response = await this.http.request({
      method: 'GET',
      url: this.#categoriesURL,
      config: { baseURL: '/api', ...(signal && { signal }) }
    })

    const results = Array.isArray(response.data) ? response.data : (response.data?.results ?? [])
    return MarketplaceAdapter.transformCategories(results)
  }

  listMarketplaceService = async (params = {}) => {
    const { type = 'marketplace', category, search } = params
    const queryKey = queryKeys.marketplace.list({ type, category, search })
    const isSearch = !!search
    const isAllList = category === 'all' && !search

    return await this.useEnsureQueryData(
      queryKey,
      ({ signal } = {}) =>
        this.fetchList(params, signal ? { signal } : { abortIdentifier: ABORT_ID_LIST }),
      {
        cacheType: this.cacheType.STATIC,
        persist: isAllList,
        skipCache: isSearch
      }
    )
  }

  listCategoriesMarketplaceService = async () => {
    const queryKey = queryKeys.marketplace.categories()

    return await this.useEnsureQueryData(
      queryKey,
      ({ signal }) => this.fetchCategories({ signal }),
      {
        cacheType: this.cacheType.STATIC,
        persist: true
      }
    )
  }

  prefetchMarketplace = async () => {
    const listParams = { type: 'marketplace', category: 'all' }
    const listKey = queryKeys.marketplace.list(listParams)
    const categoriesKey = queryKeys.marketplace.categories()

    await Promise.allSettled([
      this.useEnsureQueryData(listKey, ({ signal }) => this.fetchList(listParams, { signal }), {
        cacheType: this.cacheType.STATIC,
        persist: true
      }),
      this.useEnsureQueryData(categoriesKey, ({ signal }) => this.fetchCategories({ signal }), {
        cacheType: this.cacheType.STATIC,
        persist: true
      })
    ])
  }

  prefetchListByCategories = async (slugs = []) => {
    await Promise.allSettled(
      slugs.map((slug) => this.listMarketplaceService({ type: 'marketplace', category: slug }))
    )
  }

  getFromCache = ({ vendor, solution }) => {
    if (!vendor || !solution) return undefined

    const allQueries = this.queryClient.getQueryCache().getAll()

    for (const query of allQueries) {
      const key = query.queryKey
      if (!Array.isArray(key) || key[0] !== 'marketplace') continue

      const listData = query.state?.data
      if (!Array.isArray(listData)) continue

      const item = listData.find(
        (el) => el.vendor?.slug === vendor && el.slug === solution
      )

      if (item) {
        return {
          id: item.id,
          name: item.name,
          slug: item.slug,
          referenceId: item.referenceId,
          headline: item.headline,
          vendor: item.vendor,
          lastUpdate: item.updatedAt,
          latestVersion: item.latestVersion,
          version: item.latestVersion,
          instanceType: item.instanceType,
          category: item.category,
          featured: item.featured,
          released: item.released
        }
      }
    }

    return undefined
  }
}

export const marketplaceService = new MarketplaceService()
