import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from './make-edge-application-base-url'

export const editEdgeApplicationService = async (payload) => {
  const parsedPayload = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${payload.id}`,
    method: 'PATCH',
    body: parsedPayload
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    name: payload.name,
    certificate: payload.certificate,
    private_key: payload.privateKey
  }
}
