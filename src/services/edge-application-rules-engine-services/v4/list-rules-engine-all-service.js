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

const countPhases = (results) => {
  const { countRequest, countResponse } = results.reduce(
    (counts, { phase }) => {
      if (phase === 'request') counts.countRequest++
      if (phase === 'response') counts.countResponse++
      return counts
    },
    { countRequest: 0, countResponse: 0 }
  )

  return {
    default: { max: 0, min: 0 },
    request: { max: countRequest, min: 1 },
    response: { max: countRequest + countResponse, min: countRequest + 1 }
  }
}

const getMaxOrderType = (phase, types) => types[`${phase}`]

const adapt = (results, statusCode) => {
  const typesRules = countPhases(results)

  return {
    count: results.length,
    body: results.map((rule, index) => ({
      id: rule.id,
      name: rule.name,
      phase: phaseAsTag(rule.phase),
      behaviors: rule.behaviors,
      criteria: rule.criteria,
      status: STATUS_AS_TAG[rule.active],
      position: {
        value: index,
        immutableValue: index,
        altered: false,
        ...getMaxOrderType(rule.phase, typesRules)
      },
      description: rule.description || '-'
    })),
    statusCode
  }
}
