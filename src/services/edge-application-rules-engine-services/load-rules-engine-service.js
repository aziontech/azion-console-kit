import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from '../edge-application-services/make-edge-application-base-url'
import { parsedBehavior } from './helper-behavior'
export const loadRulesEngineService = async ({ edgeApplicationId, id, phase }) => {
  const rulesPhase = generateRulePhase(phase)

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${edgeApplicationId}/rules_engine/${rulesPhase}/rules/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

/**
 *
 * @param {Object} phase
 * @param {string | undefined} phase.content
 * @returns {string}
 */
const generateRulePhase = (phase) => {
  const DEFAULT_RULE_PHASE = 'Default'
  return phase.content === DEFAULT_RULE_PHASE ? 'request' : phase.content?.toLowerCase()
}

const adapt = (httpResponse) => {
  const ruleEngine = httpResponse.body.results
  const parsedBody = {
    id: ruleEngine.id,
    name: ruleEngine.name,
    phase: ruleEngine.phase,
    criteria: ruleEngine.criteria,
    behaviors: parsedBehavior(ruleEngine.behaviors),
    isActive: ruleEngine.is_active,
    order: ruleEngine.order,
    description: ruleEngine.description
  }

  return {
    body: parsedBody,
    statusCode: httpResponse.statusCode
  }
}
