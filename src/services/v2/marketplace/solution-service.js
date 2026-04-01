import { BaseService } from '@/services/v2/base/query/baseService'
import { useAccountStore } from '@/stores/account'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class SolutionService extends BaseService {
  baseUrl = 'marketplace/solution/'

  async getListSolutions({ group, type }) {
    const response = await this.http.request({
      method: 'GET',
      url: this.baseUrl,
      config: { baseURL: '/api', headers: { 'Mktp-Api-Context': type } },
      params: { group }
    })

    return this.#adaptResponse(response)
  }

  useListSolutions(params) {
    const { group, type } = params
    return this.useQuery(
      queryKeys.solutions.list(group, type),
      () => this.getListSolutions(params),
      {
        cacheType: this.cacheType.STATIC
      }
    )
  }

  /**
   * Ensure solutions data is cached for faster initial load
   * Called by sessionManager after login/switch account
   *
   * @param {boolean} isFlagBlockApiV4 - flag to determine template type
   */
  prefetchList(isFlagBlockApiV4 = false) {
    const accountStore = useAccountStore()
    const { jobRole } = accountStore.account

    const prefetchConfigs = [
      { group: 'templates', type: isFlagBlockApiV4 ? 'onboarding' : 'onboarding-v4' },
      { group: 'githubImport', type: 'import-from-github' }
    ]

    if (jobRole) {
      prefetchConfigs.unshift({
        group: 'recommended',
        type: isFlagBlockApiV4 ? jobRole : `${jobRole}-v4`
      })
    }

    return Promise.all(
      prefetchConfigs.map(({ group, type }) =>
        this.usePrefetchQuery(
          queryKeys.solutions.list(group, type),
          () => this.getListSolutions({ group, type }),
          { cacheType: this.cacheType.STATIC }
        )
      )
    )
  }
  #adaptResponse(response) {
    const isArray = Array.isArray(response.data)
    const parsedSolutions =
      isArray && response.data.length
        ? response.data.map((element) => ({
            id: `${element.id}`,
            name: element.name,
            referenceId: element.solution_reference_id,
            vendor: element.vendor,
            slug: element.slug,
            headline: element.headline,
            icon: element.icon,
            featured: element.featured,
            released: element.new_release,
            instanceType: {
              name: element.instance_type.name,
              isTemplate: element.instance_type.is_template
            },
            category: element.category || [],
            updatedAt: element.updated_at
          }))
        : []

    // Sort solutions alphabetically by name
    parsedSolutions.sort((solutionA, solutionB) => solutionA.name.localeCompare(solutionB.name))
    return parsedSolutions
  }
  async listTrendingSolutions({ ids = [], limit = 3 } = {}) {
    const allTrending = await this.useEnsureQueryData(
      queryKeys.solutions.trending(),
      () => this.#fetchTrendingSolutions(),
      { cacheType: this.cacheType.STATIC }
    )

    if (ids.length > 0) {
      const filtered = ids
        .map((id) => allTrending.find((solution) => solution.id === `${id}`))
        .filter(Boolean)
      return filtered
    }

    return allTrending.slice(0, limit)
  }

  async #fetchTrendingSolutions() {
    const response = await this.http.request({
      method: 'GET',
      url: this.baseUrl,
      config: { baseURL: '/api' }
    })
    return this.adaptTrendingResponse(response)
  }

  adaptTrendingResponse(response) {
    const isArray = Array.isArray(response.data)
    if (!isArray || !response.data.length) return []

    const trendingSolutions = response.data
      .filter((element) => element.featured)
      .map((element) => ({
        id: `${element.id}`,
        name: element.name,
        slug: element.slug,
        description: element.headline,
        author: element.vendor?.name || 'Unknown',
        vendorIcon: element.vendor?.icon || null,
        version: element.version || element.latest_version
      }))

    return trendingSolutions
  }
}

export const solutionService = new SolutionService()
