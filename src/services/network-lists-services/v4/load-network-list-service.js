import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeNetworkListBaseUrl } from './make-network-list-service'
import { extractApiError } from '@/helpers/extract-api-error'

export const loadNetworkListService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeNetworkListBaseUrl()}/${id}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse, id)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse, id) => {
  if (httpResponse.statusCode !== 200) {
    throw new Error(extractApiError({ body: httpResponse.body })).message
  }

  const networkList = {
    name: httpResponse.body.data.name,
    id: id,
    stringId: httpResponse.body.data.id.toString(),
    lastEditor: httpResponse.body.data.last_editor,
    networkListType: httpResponse.body.data.type,
    itemsValuesCountry:
      httpResponse.body.data.type === 'countries' ? httpResponse.body.data.items : [],
    itemsValues:
      httpResponse.body.data.type !== 'countries'
        ? httpResponse.body.data.items.toString().replaceAll(',', '\n')
        : '',
    lastModified: new Intl.DateTimeFormat('us', { dateStyle: 'full', timeStyle: 'short' }).format(
      new Date(httpResponse.body.data.last_modified)
    )
  }

  return {
    body: networkList,
    statusCode: httpResponse.statusCode
  }
}
