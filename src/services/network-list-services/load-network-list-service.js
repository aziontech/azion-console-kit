import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";
import { makeNetworkListBaseUrl } from "./make-network-list-base-url";

export const loadNetworkListService = async ({id}) => {
  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeNetworkListBaseUrl()}/${id}`,
      method: 'GET',
    })

  httpResponse = adapt(httpResponse, id);
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse, id) => {
  
    const networkList = {
      name: httpResponse.body.results.name,
      id: id,
      lastEditor: httpResponse.body.results.last_editor,
      listType: httpResponse.body.results.list_type,
      itemsValues: httpResponse.body.results.items_values,
      lastModified:  new Intl.DateTimeFormat('us', { dateStyle: 'full',timeStyle: 'short' }).format(new Date(httpResponse.body.results.last_modified)),
    }

    console.log(networkList);
  
    return {
      body: networkList,
      statusCode: httpResponse.statusCode
    }
}