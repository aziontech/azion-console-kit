import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationV4BaseUrl } from '@/services/edge-application-services/v4/make-edge-application-v4-base-url'
import { parsedBehavior } from './helper-behavior'
import { extractApiError } from '@/helpers/extract-api-error'

export const loadRulesEngineService = async ({ edgeApplicationId, id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationV4BaseUrl()}/${edgeApplicationId}/rules/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  if (httpResponse.statusCode !== 200) {
    throw new Error(extractApiError({ body: httpResponse.body })).message
  }

  const ruleEngine = httpResponse.body.data
  const parsedBody = {
    id: ruleEngine.id,
    name: ruleEngine.name,
    phase: ruleEngine.phase,
    criteria: ruleEngine.criteria,
    behaviors: parsedBehavior(ruleEngine.behaviors),
    isActive: ruleEngine.active,
    order: ruleEngine.order,
    description: ruleEngine.description
  }

  return {
    body: parsedBody,
    statusCode: httpResponse.statusCode
  }
}
