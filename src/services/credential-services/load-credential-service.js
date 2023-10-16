import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeCredentialsBaseUrl } from './make-credentials-base-url'

export const loadCredentialService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeCredentialsBaseUrl()}/${id}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const body = httpResponse.body

  const parsedVariable = {
    id: body?.id,
    name: body?.name,
    description: body?.description,
    token: body?.token,
    status: body?.status,
    lastEditor: body?.last_editor,
    lastModified: body?.last_modified
  }

  return {
    body: parsedVariable,
    statusCode: httpResponse.statusCode
  }
}
