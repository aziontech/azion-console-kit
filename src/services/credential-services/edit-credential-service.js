import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeCredentialsBaseUrl } from './make-credentials-base-url'

export const editCredentialService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeCredentialsBaseUrl()}/${payload.id}`,
    method: 'PATCH',
    body: adapt(payload)
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    name: payload.name,
    description: payload.description,
    status: payload.status
  }
}
