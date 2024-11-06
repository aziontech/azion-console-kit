import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeWorkloadsBaseUrl } from './make-workloads-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'
import * as Errors from '@/services/axios/errors'

export const searchWorkloadsService = async ({
  fields = 'id, name',
  ordering = 'name',
  page = 1,
  pageSize = 50000,
  search = ''
} = {}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeWorkloadsBaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parsedDomains = httpResponse.body.results?.map((domain) => ({
    value: domain.id,
    label: domain.name
  }))

  return {
    body: parsedDomains,
    statusCode: httpResponse.statusCode
  }
}

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return httpResponse.body
    case 400:
      throw new Errors.InvalidApiRequestError().message
    case 403:
      throw new Errors.PermissionError().message
    case 404:
      throw new Errors.NotFoundError().message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}

