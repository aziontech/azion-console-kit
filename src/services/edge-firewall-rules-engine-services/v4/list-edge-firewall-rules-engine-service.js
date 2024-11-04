import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeFirewallBaseUrl } from '../../edge-firewall-services/v4/make-edge-firewall-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'
import { formatExhibitionDate } from '@/helpers/convert-date'
export const listEdgeFirewallRulesEngineService = async ({
  edgeFirewallId,
  fields = '',
  search = '',
  ordering = '',
  page = 1,
  pageSize = 10
}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFirewallBaseUrl()}/${edgeFirewallId}/rules?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const parseStatus = (isActive) => {
  return isActive
    ? {
        content: 'Active',
        severity: 'success'
      }
    : {
        content: 'Inactive',
        severity: 'danger'
      }
}

const adapt = (httpResponse) => {
  const parsedRulesEngine = httpResponse.body.results?.map((ruleEngine) => {
    return {
      id: ruleEngine.id,
      name: ruleEngine.name,
      description: ruleEngine.description || '',
      lastModified: formatExhibitionDate(ruleEngine.last_modified, 'long', 'short'),
      lastEditor: ruleEngine.last_editor,
      status: parseStatus(ruleEngine.is_active)
    }
  })

  const count = httpResponse.body?.count ?? 0

  return {
    count,
    body: parsedRulesEngine,
    statusCode: httpResponse.statusCode
  }
}

// const formatExhibitionDate = (dateString) => {
//   return new Intl.DateTimeFormat('us', {
//     dateStyle: 'long',
//     timeStyle: 'short',
//     timeZone: 'UTC'
//   }).format(new Date(dateString))
// }
