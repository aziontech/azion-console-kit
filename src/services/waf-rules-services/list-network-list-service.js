import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeNetworkListBaseUrl } from '../network-lists-services/make-network-list-base-url'

export const listNetworkListService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeNetworkListBaseUrl()}?pagination=false&exclude_azion_lists=true`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const isArray = Array.isArray(httpResponse.body.results)

  const networkList = isArray
    ? httpResponse.body.results.map((networkList) => ({
        id: networkList.id,
        name: networkList.name,
      }))
    : []

  return {
    body: networkList,
    statusCode: httpResponse.statusCode
  }
}
