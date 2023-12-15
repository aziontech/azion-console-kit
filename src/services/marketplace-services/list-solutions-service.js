import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeMarketplaceBaseUrl } from './make-marketplace-base-url'

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

  return {
    body: parsedServices,
    statusCode: httpResponse.statusCode
  }
}
