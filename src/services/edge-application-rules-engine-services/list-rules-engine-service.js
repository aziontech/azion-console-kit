import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from '../edge-application-services/make-edge-application-base-url'
import { capitalizeFirstLetter } from '@/helpers'

export const listRulesEngineService = async ({
  id,
  phase = 'request',
  orderBy = 'order',
  sort = 'asc',
  page = 1,
  pageSize = 200
}) => {
  const searchParams = makeSearchParams({ orderBy, sort, page, pageSize })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${id}/rules_engine/${phase}/rules?${searchParams.toString()}`,
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
      status: STATUS_AS_TAG[rules.is_active],
      order: rules.order,
      description: rules.description || '-'
    }
  })

  const keepSameOrder = 0;
  const putItAfter = 1;
  const putIfBefore = -1;

  const sortParsedRulesEgine = parsedRulesEgine.sort((sortA, sortB) => {
    if (sortA.name === 'Default Rule') return putIfBefore
    if (sortB.name === 'Default Rule') return putItAfter
    return keepSameOrder
  })

  return {
    body: sortParsedRulesEgine,
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
