import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeAccountsManagementBaseUrl } from './make-accounts-management-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listAccountsService = async ({
  ordering = 'id',
  search = '',
  account_type = '',
  page = 1,
  pageSize = 10,
  fields = ''
}) => {
  const searchParams = makeListServiceQueryParams({ ordering, page, pageSize, search, fields })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeAccountsManagementBaseUrl()}?account_type=${account_type}&${searchParams.toString()}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const count = httpResponse.body.count
  const parsedBody = httpResponse.body.results.map((item) => {
    return {
      id: item.id,
      name: item.name,
      company: item.company_name,
      status: item.is_active
        ? {
            content: 'Active',
            severity: 'success'
          }
        : {
            content: 'Inactive',
            severity: 'error'
          }
    }
  })
  return {
    count,
    body: parsedBody,
    statusCode: httpResponse.statusCode
  }
}
