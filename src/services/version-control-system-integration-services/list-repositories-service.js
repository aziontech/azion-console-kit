import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeVersionControlSystemBaseUrl } from './make-version-control-system-base-url'

export const listRepositoriesService = async (uuid) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeVersionControlSystemBaseUrl()}/integrations/${uuid}/repositories`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parsedRepositories = httpResponse.body.results

  return {
    body: parsedRepositories,
    statusCode: httpResponse.statusCode
  }
}
