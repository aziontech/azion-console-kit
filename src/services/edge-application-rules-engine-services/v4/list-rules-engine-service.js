import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationV4BaseUrl } from '@/services/edge-application-services/v4/make-edge-application-v4-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'
import { capitalizeFirstLetter } from '@/helpers'

export const listRulesEngineService = async ({
  id,
  fields = '',
  ordering = 'name',
  page = 1,
  pageSize = 200
}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationV4BaseUrl()}/${id}/rules?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
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

const adapt = (httpResponse) => {
  const parsedRulesEgine = httpResponse.body.results?.map((rules) => {
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

  const keepSameOrder = 0
  const putItAfter = 1
  const putIfBefore = -1

  const sortParsedRulesEgine = parsedRulesEgine.sort((currentItem, nextItem) => {
    if (currentItem.name === 'Default Rule') return putIfBefore
    if (nextItem.name === 'Default Rule') return putItAfter
    return keepSameOrder
  })

  return {
    body: sortParsedRulesEgine,
    statusCode: httpResponse.statusCode
  }
}
