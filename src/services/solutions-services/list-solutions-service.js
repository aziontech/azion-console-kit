import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeSolutionsBaseUrl } from './make-solutions-base-url'

/**
 * Retrieves a list of solutions from the marketplace API based on the specified API context.
 *
 * @param {Object} options - The options for retrieving the solutions.
 * @param {string} options.group - The group of the solutions. Used for caching.
 * @param {string} options.type - The API context. Defaults to 'onboarding'.
 * @return {Promise<Object>} A promise that resolves to the parsed HTTP response containing the list of solutions.
 */
export const listSolutionsService = async ({ group, type = 'onboarding' }) => {
  const searchParams = makeSearchParams({ group })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeSolutionsBaseUrl()}/${searchParams}`,
    method: 'GET',
    headers: {
      'Mktp-Api-Context': type
    }
  })
  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const makeSearchParams = ({ group }) => {
  const searchParams = new URLSearchParams()

  if (group) {
    searchParams.set('group', group)
  }

  return `?${searchParams.toString()}`
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
