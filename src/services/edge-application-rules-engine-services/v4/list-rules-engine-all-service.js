import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationV4BaseUrl } from '@/services/edge-application-services/v4/make-edge-application-v4-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'
import { capitalizeFirstLetter } from '@/helpers'

export const listRulesEngineServiceAll = async ({ id, fields = '', search = '' }) => {
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
      url: `${makeEdgeApplicationV4BaseUrl()}/${id}/rules?${searchParams.toString()}`,
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

const phaseAsTag = (phase) => {
  return {
    content: capitalizeFirstLetter(phase),
    outlined: true,
    severity: 'info'
  }
}

const adapt = (results, statusCode) => {
  const parsedRulesEngine = results.map((rules) => {
    return {
      id: rules.id,
      name: rules.name,
      phase: phaseAsTag(rules.phase),
      behaviors: rules.behaviors,
      criteria: rules.criteria,
      status: STATUS_AS_TAG[rules.active],
      order: rules.order,
      description: rules.description || '-'
    }
  })

  const count = results.length

  return {
    count,
    body: parsedRulesEngine,
    statusCode
  }
}
