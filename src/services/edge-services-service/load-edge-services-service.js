import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeServicesBaseUrl } from './make-edge-services-base-url'

export const loadEdgeServicesService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeServicesBaseUrl()}/${id}?with_vars=true`,
    method: 'GET'
  })

  return parseHttpResponse(httpResponse)
}

// const adapt = (httpResponse) => {
//   const parsedVariable = {
//     ...httpResponse.body
//   }

//   return {
//     body: parsedVariable,
//     statusCode: httpResponse.statusCode
//   }
// }
