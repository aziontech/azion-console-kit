import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeFirewallBaseUrl } from '../../edge-firewall-services/v4/make-edge-firewall-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'
import { formatExhibitionDate } from '@/helpers/convert-date'

export const listEdgeFirewallRulesEngineService = async ({ id, fields = '', search = '' }) => {
  let allData = []
  let currentPage = 1
  let httpResponse = null
  let hasMoreData = true

  while (hasMoreData) {
    const searchParams = makeListServiceQueryParams({
      fields,
      ordering: '',
      page: currentPage,
      pageSize: 100,
      search
    })

    httpResponse = await AxiosHttpClientAdapter.request({
      url: `${makeEdgeFirewallBaseUrl()}/${id}/rules?${searchParams.toString()}`,
      method: 'GET'
    })

    const { count, results } = httpResponse.body
    allData = [...allData, ...results]

    hasMoreData = !(allData.length >= count)

    currentPage++
  }

  const allDataAdapt = adapt(allData, httpResponse.statusCode)

  return parseHttpResponse(allDataAdapt)
}

const STATUS_AS_TAG = {
  true: {
    content: 'Active',
    severity: 'success'
  },
  false: {
    content: 'Inactive',
    severity: 'danger'
  }
}

const adapt = (results, statusCode) => {
  const parsedRulesEngine = results.map((rules, index) => {
    return {
      id: rules.id,
      name: rules.name,
      description: rules.description || '',
      lastModified: formatExhibitionDate(rules.last_modified, 'long', 'short'),
      lastEditor: rules.last_editor,
      status: STATUS_AS_TAG[rules.active],
      position: {
        value: index,
        immutableValue: index,
        altered: false,
        min: 0,
        max: results.length - 1
      }
    }
  })

  const count = results.length

  return {
    count,
    body: parsedRulesEngine,
    statusCode
  }
}
