import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeDomainsBaseUrl } from './make-domains-base-url'
import { listEdgeApplicationsService } from '@/services/edge-application-services/list-edge-applications-service'

export const listDomainsService = async ({
  orderBy = 'name',
  sort = 'asc',
  page = 1,
  pageSize = 3000
}) => {
  const searchParams = makeSearchParams({ orderBy, sort, page, pageSize })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDomainsBaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = await adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = async (httpResponse) => {
  const edgeApplications = await listEdgeApplications()
  const DEFAULT_AZION_DIGITAL_CERTIFICATE = 'Azion (SAN)'
  const parsedDomains = httpResponse.body.results?.map((domain) => {
    return {
      id: domain.id,
      name: domain.name,
      active: domain.is_active
        ? {
            content: 'Active',
            severity: 'success'
          }
        : {
            content: 'Inactive',
            severity: 'danger'
          },
      activeSort: domain.is_active,
      domainName: {
        content: domain.domain_name
      },
      cnames: domain.cnames,
      edgeFirewallId: domain.edge_firewall_id,
      edgeApplicationName: getEdgeApplication(edgeApplications, domain.edge_application_id),
      digitalCertificateId: domain.digital_certificate_id || DEFAULT_AZION_DIGITAL_CERTIFICATE
    }
  })

  return {
    body: parsedDomains,
    statusCode: httpResponse.statusCode
  }
}

const makeSearchParams = ({ orderBy, sort, page, pageSize }) => {
  const searchParams = new URLSearchParams()
  searchParams.set('order_by', orderBy)
  searchParams.set('sort', sort)
  searchParams.set('page', page)
  searchParams.set('page_size', pageSize)

  return searchParams
}

const listEdgeApplications = async () => {
  const edgeApplications = await listEdgeApplicationsService({})

  return edgeApplications.map((edgeApp) => ({ name: edgeApp.name, id: edgeApp.id }))
}

const getEdgeApplication = (edgeApplications, edge_application_id) => {
  const edgeApplication = edgeApplications.filter((edgeapp) => edgeapp.id === edge_application_id)

  if (edgeApplication.length > 0) {
    return edgeApplication[0].name
  }
  return ''
}
