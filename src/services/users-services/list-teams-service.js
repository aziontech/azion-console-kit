import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeTeamsBaseUrl } from './make-teams-base-url'

export const listTeamsService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeTeamsBaseUrl()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const { statusCode, body } = httpResponse

  if (!body || !Array.isArray(body)) {
    throw new Error('Invalid data structure in HTTP response')
  }

  const teamsFormatted = body.map((item) => ({
    label: item.name,
    value: item.id
  }))

  return {
    body: teamsFormatted,
    statusCode
  }
}
