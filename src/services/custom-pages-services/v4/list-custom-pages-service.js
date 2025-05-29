import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeCustomPagesBaseUrl } from './make-custom-pages-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listCustomPagesService = async ({
  search = '',
  fields = '',
  ordering = 'name',
  page = 1,
  pageSize = 10
} = {}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeCustomPagesBaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const parseStatusData = (status) => {
  const parsedStatus = status
    ? {
        content: 'Active',
        severity: 'success'
      }
    : {
        content: 'Inactive',
        severity: 'danger'
      }

  return parsedStatus
}
const parseDefaultData = (status) => {
  const parsedStatus = status
    ? {
        content: 'Yes',
        severity: 'success'
      }
    : {
        content: 'No',
        severity: 'danger'
      }

  return parsedStatus
}

const adapt = (httpResponse) => {
  const parsedBody =
    httpResponse.body?.results?.map((customPage) => {
      return {
        ...(customPage.id && { id: customPage.id }),
        ...(customPage.name && { name: customPage.name }),
        ...(customPage.last_editor && { lastEditor: customPage.last_editor }),
        ...(customPage.last_modified && { 
          lastModified: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
            new Date(customPage.last_modified)
          )
        }),
        ...(customPage.active !== undefined && { active: parseStatusData(customPage.active) }),
        ...(customPage.default !== undefined && { default: parseDefaultData(customPage.default) })
      }
    }) ?? []

  const count = httpResponse.body?.count ?? 0

  return {
    count,
    body: parsedBody,
    statusCode: httpResponse.statusCode
  }
}
