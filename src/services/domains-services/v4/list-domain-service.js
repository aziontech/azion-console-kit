import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeDomainsBaseUrl } from './make-domains-service'
import { listEdgeApplicationsService } from '@/services/edge-application-services/list-edge-applications-service'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listDomainsService = async ({
  search = '',
  fields = '',
  ordering = 'name',
  page = 1,
  pageSize = 10
}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDomainsBaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = await adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = async (httpResponse) => {
  const edgeApplications = await listEdgeApplications()
  const parsedDomains = httpResponse.body.results?.map((domain) => {
    return {
      id: domain.id,
      name: domain.name,
      active: domain.active
        ? {
            content: 'Active',
            severity: 'success'
          }
        : {
            content: 'Inactive',
            severity: 'danger'
          },
      activeSort: domain.active,
      domainName: {
        content: domain.domains[0].domain
      },
      cnames: domain.alternate_domains,
      edgeApplicationName: getEdgeApplication(edgeApplications, domain.edge_application)
    }
  })

  const count = httpResponse.body?.count ?? 0

  return {
    count,
    body: parsedDomains,
    statusCode: httpResponse.statusCode
  }
}

const listEdgeApplications = async () => {
  const edgeApplications = await listEdgeApplicationsService({})

  return edgeApplications.map((edgeApp) => ({ name: edgeApp.name, id: edgeApp.id }))
}

const getEdgeApplication = (edgeApplications, edge_application_id) => {
  const edgeApplication = edgeApplications.filter((edgeapp) => edgeapp.id === edge_application_id)

  if (edgeApplication.length) {
    return edgeApplication[0]?.name
  }
  return ''
}
