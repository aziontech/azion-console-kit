import { BaseService } from '../base/BaseService'

export class SolutionService extends BaseService {
  constructor() {
    super()
    this.baseURL = 'marketplace/solution/'
  }

  getListSolutions = async ({ group, type = 'onboarding' }) => {
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

  // Simple method - automatically cached and persisted
  useListSolutions({ group, type = 'onboarding' }) {
    return this.useGlobalQuery(
      ['solutions', 'list', { group, type }], 
      () => this.getListSolutions({ group, type })
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

// Export singleton instance
export const solutionService = new SolutionService()
