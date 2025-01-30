import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeWorkloadsDeploymentBaseUrl } from './make-workload-deployment-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listWorkloadDeploymentsService = async ({
  search = '',
  fields = '',
  ordering = 'name',
  page = 1,
  pageSize = 10,
  id,
  all = false
}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeWorkloadsDeploymentBaseUrl()}/${id}/deployments?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = await adapt(httpResponse, all)

  return parseHttpResponse(httpResponse)
}

const adapt = async (httpResponse, all) => {
  const workloadDeployments = httpResponse.body.results
  const hasItem = workloadDeployments.length
  const parsedWorkloadDeployments = hasItem
    ? workloadDeployments.map((workload) => ({
        id: workload.id,
        tag: workload.tag,
        current: workload.current,
        edgeApplication: workload.binds.edge_application,
        edgeFirewall: workload.binds.edge_firewall
      }))
    : []

  return {
    body: all ? parsedWorkloadDeployments : parsedWorkloadDeployments[0],
    statusCode: httpResponse.statusCode
  }
}
