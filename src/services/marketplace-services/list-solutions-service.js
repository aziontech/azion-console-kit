import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeMarketplaceBaseUrl } from './make-marketplace-base-url'

/**
 * Retrieves a list of solutions from the marketplace API based on the specified category, search query, and API context.
 *
 * @param {Object} options - The options for retrieving the solutions.
 * @param {string} options.category - The category of solutions to retrieve. Defaults to an empty string.
 * @param {string} options.search - The search query to filter the solutions. Defaults to an empty string.
 * @param {string} options.type - The API context. Defaults to 'onboarding'.
 * @return {Promise<Object>} A promise that resolves to the parsed HTTP response containing the list of solutions.
 */
export const listSolutionsService = async ({ category = '', search = '', type = 'onboarding' }) => {
  const searchParams = makeSearchParams({ category, search })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeMarketplaceBaseUrl()}/solution/?${searchParams.toString()}`,
    method: 'GET',
    headers: {
      'Mktp-Api-Context': type
    }
  })
  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const makeSearchParams = ({ category, search }) => {
  const searchParams = new URLSearchParams()

  if (category) {
    searchParams.set('category', category)
  }
  if (search) {
    searchParams.set('search', search)
  }

  return searchParams
}

const adapt = (httpResponse) => {
  const isArray = Array.isArray(httpResponse.body)
  const parsedServices =
    isArray && httpResponse.body.length
      ? httpResponse.body.map((element) => ({
          id: element.id,
          name: element.name,
          referenceId: element.solution_reference_id,
          vendor: element.vendor,
          slug: element.slug,
          headline: element.headline,
          featured: element.featured,
          released: element.new_release,
          instanceType: {
            isTemplate: element.instance_type.is_template
          }
        }))
      : []

  parsedServices.sort((serviceA, serviceB) => serviceA.name.localeCompare(serviceB.name))

  return {
    body: parsedServices,
    statusCode: httpResponse.statusCode
  }
}
