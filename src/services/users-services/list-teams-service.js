import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeTeamsBaseUrl } from './make-teams-base-url'
import { InvalidDataStructureError } from '../axios/errors'

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

  if (!body || !Array.isArray(body.results)) {
    throw new InvalidDataStructureError().message
  }

  const teamsFormatted = body.results.map((item) => ({
    label: item.name,
    value: item.id
  }))

  return {
    body: teamsFormatted,
    statusCode
  }
}
