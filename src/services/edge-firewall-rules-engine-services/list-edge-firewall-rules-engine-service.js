import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeFirewallRulesEngineBaseUrl } from './make-edge-firewall-rules-engine-base-url'
export const listEdgeFirewallRulesEngineService = async ({
  orderBy = 'id',
  sort = 'asc',
  page = 1,
  pageSize = 200,
  edgeFirewallId
}) => {
  const searchParams = makeSearchParams({ orderBy, sort, page, pageSize })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFirewallRulesEngineBaseUrl(edgeFirewallId)}?${searchParams.toString()}`,
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
      lastModified: formatExhibitionDate(ruleEngine.last_modified),
      lastEditor: ruleEngine.last_editor,
      status: parseStatus(ruleEngine.is_active)
    }
  })

  return {
    body: parsedRulesEngine,
    statusCode: httpResponse.statusCode
  }
}

const formatExhibitionDate = (dateString) => {
  return new Intl.DateTimeFormat('us', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'UTC'
  }).format(new Date(dateString))
}

const makeSearchParams = ({ orderBy, sort, page, pageSize }) => {
  const searchParams = new URLSearchParams()
  searchParams.set('order_by', orderBy)
  searchParams.set('sort', sort)
  searchParams.set('page', page)
  searchParams.set('page_size', pageSize)

  return searchParams
}
