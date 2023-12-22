import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeMarketplaceBaseUrl } from './make-marketplace-base-url'

export const listEdgeApplicationsAvailablesService = async ({ vendor, solution }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeMarketplaceBaseUrl()}/rtm_integration/user_edge_applications/${vendor}/${solution}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const results = httpResponse.body || []

  const parsed = results.map((item) => ({
    id: item.id,
    name: item.name,
    upgradeable: item.upgradeable,
    elegibleForInstall: item.elegible_for_install,
    needToEnableEdgeFunctionsModule: item.need_to_enable_edge_functions_module
  }))

  return {
    body: parsed,
    statusCode: httpResponse.statusCode
  }
}
