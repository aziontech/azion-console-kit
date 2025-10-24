import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeTeamsBaseUrl } from './make-teams-base-url'
import { InvalidDataStructureError } from '../axios/errors'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listTeamsService = async ({
  fields = '',
  ordering = 'name',
  page = 1,
  pageSize = 100,
  search = ''
} = {}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeTeamsBaseUrl()}?${searchParams.toString()}`,
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
