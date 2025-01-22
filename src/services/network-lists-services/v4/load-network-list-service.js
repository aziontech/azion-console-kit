import { AxiosHttpClientAdapter, parseHttpResponse } from '../../axios/AxiosHttpClientAdapter'
import { makeNetworkListBaseUrl } from './make-network-list-service'

export const loadNetworkListService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeNetworkListBaseUrl()}/${id}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse, id)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse, id) => {
  const networkList = {
    name: httpResponse.body.data.name,
    id: id,
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
