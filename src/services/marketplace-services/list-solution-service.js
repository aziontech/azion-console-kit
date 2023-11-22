import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeMarketplaceBaseUrl } from './make-marketplace-base-url'

export const listSolution = async (vendor, solution) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeMarketplaceBaseUrl()}/solution/${vendor}/${solution}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parsedServices = {
    id: httpResponse.body.id,
    name: httpResponse.body.name,
    referenceId: httpResponse.body.solution_reference_id,
    vendor: httpResponse.body.vendor,
    headline: httpResponse.body.headline,
    version: httpResponse.body.version,
    lastUpdate: httpResponse.body.updated_at,
    usage: httpResponse.body.usage,
    overview: httpResponse.body.overview
  }

  return {
    body: parsedServices,
    statusCode: httpResponse.statusCode
  }
}
