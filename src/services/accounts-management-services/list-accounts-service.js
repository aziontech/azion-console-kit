import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeAccountsManagementBaseUrl } from './make-accounts-management-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listAccountsService = async ({
  ordering = 'name',
  search = '',
  account_type = '',
  page = 1,
  pageSize = 10
}) => {
  const searchParams = makeListServiceQueryParams({ ordering, page, pageSize, search })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeAccountsManagementBaseUrl()}?account_type=${account_type}&${searchParams.toString()}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const count = httpResponse.body.count
  const filteredList = httpResponse.body.results.filter((item) => !item.is_deleted)
  const parsedBody = filteredList.map((item) => {
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
