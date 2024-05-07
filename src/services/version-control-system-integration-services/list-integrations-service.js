import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeVersionControlSystemBaseUrl } from './make-version-control-system-base-url'

export const listIntegrationsService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeVersionControlSystemBaseUrl()}/integrations?page_size=200`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parsedIntegrations =
    httpResponse.body?.results?.map((integration) => {
      const uri = integration.platform.callback_url.split('vcs')[1]

      return {
        label: integration.scope,
        value: integration.uuid,
        callbackUrl: uri
      }
    }) || []

  return {
    body: parsedIntegrations,
    statusCode: httpResponse.statusCode
  }
}
