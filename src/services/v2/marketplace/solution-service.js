import { BaseService } from '@/services/v2/base/query/baseService'

export class SolutionService extends BaseService {
  constructor() {
    super()
    this.baseURL = 'marketplace/solution/'
  }

  getListSolutions = async ({ group, type }) => {
    const response = await this.http.request({
      method: 'GET',
      url: this.baseURL,
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

  useListSolutions({ group, type }, options = {}) {
    return this.useQuery({
      key: ['solutions', 'list', group, type],
      queryFn: () => this.getListSolutions({ group, type }),
      cache: this.cacheType.GLOBAL,
      staleTime: this.cacheTime.THIRTY_DAYS,
      refetchInterval: false,
      ...options
    })
  }

  async invalidateSolutionsCache() {
    await this.queryClient.invalidateQueries({
      predicate: (query) =>
        query.queryKey[0] === this.cacheType.GLOBAL &&
        query.queryKey.includes('solutions') &&
        query.queryKey.includes('list')
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
