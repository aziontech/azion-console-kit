import { BaseService } from '@/services/v2/base/query/baseService'
import { unref } from 'vue'

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
      config: {
        baseURL: '/api',
        headers: {
          'Mktp-Api-Context': type
        }
      },
      params: { group }
    })

    return this.#adaptResponse(response)
  }

  useListSolutions(params, options = {}) {
    return this._createQuery(
      () => {
        const unreffedParams = unref(params)
        return solutionsKeys.list(unreffedParams.group, unreffedParams.type)
      },
      async () => {
        const unreffedParams = unref(params)
        return this.getListSolutions(unreffedParams)
      },
      {},
      {
        staleTime: this.cacheTime.THIRTY_DAYS,
        refetchInterval: false,
        ...options
      }
    )
  }

  async invalidateSolutionsCache() {
    await this.queryClient.invalidateQueries({
      queryKey: solutionsKeys.lists()
    })
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
