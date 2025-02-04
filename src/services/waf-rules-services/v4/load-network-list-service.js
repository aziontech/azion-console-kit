import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeNetworkListBaseUrl } from '../../network-lists-services/v4/make-network-list-service'
import { extractApiError } from '@/helpers/extract-api-error'

export const loadNetworkListService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeNetworkListBaseUrl()}/${id}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse, id)
  return parseHttpResponse(httpResponse)
}

const adapt = ({ body, statusCode }) => {
  if (statusCode !== 200) {
    throw new Error(extractApiError({ body })).message
  }

  const element = body?.results

  const disabledIP = element.type === 'ip_cidr'
  const disabledCountries = element.type === 'countries'
  const networkList = {
    value: {
      id: element.id,
      disabledIP,
      disabledCountries
    },
    name: element.name
  }

  return {
    body: networkList,
    statusCode
  }
}
