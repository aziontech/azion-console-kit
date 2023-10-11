import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeCredentialsBaseUrl } from './make-credentials-base-url'

export const createCredentialService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeCredentialsBaseUrl()}`,
    method: 'POST',
    body: adapt(payload)
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    name: payload.name,
    description: payload.description,
    status: true
  }
}
