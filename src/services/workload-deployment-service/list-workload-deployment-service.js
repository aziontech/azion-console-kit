import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeWorkloadsDeploymentBaseUrl } from './make-workload-deployment-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listWorkloadDeploymentsService = async ({
  search = '',
  fields = '',
  ordering = 'name',
  page = 1,
  pageSize = 10,
  id
}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeWorkloadsDeploymentBaseUrl()}/${id}/deployments?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = await adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = async (httpResponse) => {
  const parsedWorkloadDeployments = httpResponse.body.results?.map((domain) => {
    return {
      id: domain.id,
      tag: domain.tag,
      current: domain.current,
      edgeApplication: domain.edge_application,
      edgeFirewall: domain.edge_firewall
    }
  })

  const count = httpResponse.body?.count ?? 0

  return {
    count,
    body: parsedWorkloadDeployments,
    statusCode: httpResponse.statusCode
  }
}
