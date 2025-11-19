import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { httpService } from '@/services/v2/base/http/httpService'
import { createQueryKeyFactory } from '@/services/v2/base/query/queryKeyFactory'
import { QUERY_CONFIG } from '@/services/v2/base/query/config'

export const solutionKeys = createQueryKeyFactory('solutions')

function adaptSolutionsResponse(response) {
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

export const solutionQueryOptions = {
  /**
   * List solutions by group and type
   * @param {Object} filters
   * @param {string} filters.group - Solution group (recommended, templates, githubImport)
   * @param {string} filters.type - Context type
   */
  list: (filters) => ({
    queryKey: solutionKeys.list(filters),
    queryFn: async () => {
      const response = await httpService.request({
        method: 'GET',
        url: 'marketplace/solution/',
        config: {
          baseURL: '/api',
          headers: {
            'Mktp-Api-Context': filters.type
          }
        },
        params: { group: filters.group }
      })

      return adaptSolutionsResponse(response)
    },
    ...QUERY_CONFIG.STATIC
  })
}

export function useListSolutions(filters, options = {}) {
  return useQuery({
    ...solutionQueryOptions.list(filters),
    ...options
  })
}

/**
 * Get query client instance for manual cache operations
 */
export function useSolutionQueryClient() {
  return useQueryClient()
}

/**
 * Invalidate all solution list queries
 * Useful after mutations that affect solution data
 */
export function useInvalidateSolutionsList() {
  const queryClient = useSolutionQueryClient()

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: solutionKeys.lists()
    })
  }
}

/**
 * Invalidate all solution queries (lists and details)
 */
export function useInvalidateAllSolutions() {
  const queryClient = useSolutionQueryClient()

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: solutionKeys.all
    })
  }
}

/**
 * Remove all solution queries from cache
 * More aggressive than invalidate - completely removes data
 */
export function useClearSolutionsCache() {
  const queryClient = useSolutionQueryClient()

  return async () => {
    await queryClient.removeQueries({
      queryKey: solutionKeys.all
    })
  }
}
