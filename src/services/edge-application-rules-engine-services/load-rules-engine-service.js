import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from '../edge-application-services/make-edge-application-base-url'

export const loadRulesEngineService = async ({ edgeApplicationId, id, phase }) => {
  const rulesPhase = phase.content === 'Default' ? 'request' : phase.content?.toLowerCase()

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${edgeApplicationId}/rules_engine/${rulesPhase}/rules/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const ruleEngine = httpResponse.body.results
  const parsedBody = {
    name: ruleEngine.name,
    phase: ruleEngine.phase,
    criteria: ruleEngine.criteria,
    behaviors: ruleEngine.behaviors,
    isActive: ruleEngine.is_active,
    order: ruleEngine.order,
    description: ruleEngine.description
  }

  return {
    body: parsedBody,
    statusCode: httpResponse.statusCode
  }
}
