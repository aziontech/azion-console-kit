import { BaseService } from '@/services/v2/base/query/baseService'
import { useAccountStore } from '@/stores/account'

export const solutionsKeys = {
  all: ['solutions'],
  lists: () => [...solutionsKeys.all, 'list'],
  list: (group, type) => [...solutionsKeys.lists(), group, type]
}

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
    return this._createQuery(
     solutionsKeys.list(group, type),
     () => this.getListSolutions(params), {
      staleTime: this.toMilliseconds({ days: 30 }),
      refetchInterval: false
    })
  }

  /**
   * Ensure solutions data is cached for faster initial load
   * Called by sessionManager after login/switch account
   *
   * @param {boolean} isFlagBlockApiV4 - flag to determine template type
   */
  async ensureList(isFlagBlockApiV4 = false) {
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

    await Promise.all(
      prefetchConfigs.map(({ group, type }) =>
        this._ensureQueryData(
          solutionsKeys.list(group, type),
          () => this.getListSolutions({ group, type }),
          { staleTime: this.toMilliseconds({ days: 30 }) }
        )
      )
    )
  }

  async invalidateSolutionsCache() {
    await this.queryClient.invalidateQueries({ queryKey: solutionsKeys.lists() })
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
            featured: element.featured,
            released: element.new_release,
            instanceType: {
              name: element.instance_type.name,
              isTemplate: element.instance_type.is_template
            },
            category: element.category[0]?.name,
            updatedAt: element.updated_at
          }))
        : []

    // Sort solutions alphabetically by name
    parsedSolutions.sort((solutionA, solutionB) => solutionA.name.localeCompare(solutionB.name))

    return parsedSolutions
  }
}

export const solutionService = new SolutionService()
