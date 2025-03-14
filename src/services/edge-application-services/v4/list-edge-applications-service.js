import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationV4BaseUrl } from './make-edge-application-v4-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'
const LOCKED_VALUE = 'custom'

export const listEdgeApplicationsService = async ({
  fields = '',
  search = '',
  ordering = '',
  page = 1,
  pageSize = 10
}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationV4BaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const parseName = (edgeApplication) => {
  const nameProps = { text: edgeApplication.name, tagProps: {} }

  if (edgeApplication?.product_version === LOCKED_VALUE) {
    nameProps.tagProps = {
      icon: 'pi pi-lock',
      value: 'Locked',
      outlined: true,
      severity: 'warning'
    }
  }

  return nameProps
}

const adapt = (httpResponse) => {
  const parsedEdgeApplications = httpResponse.body.results?.map((edgeApplication) => {
    return {
      id: edgeApplication.id,
      name: parseName(edgeApplication),
      disableEditClick: edgeApplication.product_version === LOCKED_VALUE,
      lastEditor: edgeApplication.last_editor,
      lastModify: dateFormat(edgeApplication.last_modified),
      lastModified: edgeApplication.last_modified,
      active: edgeApplication.active,
      isLocked: edgeApplication.product_version === LOCKED_VALUE
    }
  })

  const count = httpResponse.body?.count ?? 0

  return {
    count,
    body: parsedEdgeApplications,
    statusCode: httpResponse.statusCode
  }
}

const dateFormat = (date) => {
  return new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(new Date(date))
}
