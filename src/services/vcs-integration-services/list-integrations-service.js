import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeVcsIntegrationBaseUrl } from './make-vcs-integration-base-url'

export const listIntegrationsService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeVcsIntegrationBaseUrl()}/integrations`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parsedIntegrations = httpResponse.body?.results?.map((element) => {
    return {
      label: element.scope,
      value: element.uuid,
    }
  }) || []

  return {
    body: parsedIntegrations,
    statusCode: httpResponse.statusCode
  }
}
