import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'

export const listVulcanPresetsService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    baseURL: '/',
    url: '/v4/utils/project_samples',
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parsedIntegrations =
    httpResponse?.body?.map(({ name }) => {
      return {
        label: name,
        value: name.toLowerCase()
      }
    }) || []

  return {
    body: parsedIntegrations,
    statusCode: httpResponse.statusCode
  }
}
