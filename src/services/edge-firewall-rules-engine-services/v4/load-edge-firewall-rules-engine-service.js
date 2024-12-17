import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeFirewallBaseUrl } from '../../edge-firewall-services/v4/make-edge-firewall-base-url'
import { extractApiError } from '@/helpers/extract-api-error'

export const loadEdgeFirewallRulesEngineService = async ({ id, edgeFirewallId }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFirewallBaseUrl()}/${edgeFirewallId}/rules/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

/**
 * Parse each criteria based on its type
 * @param {Array} criteria
 * @returns {Array}
 */
const parseCriteria = (criteria) => {
  const parsedCriteria = criteria.map((criterionGroup) => {
    return criterionGroup.map((criterion) => {
      switch (criterion.variable) {
        case 'network':
          return {
            ...criterion,
            argument: criterion.argument.toString()
          }
        default:
          return criterion
      }
    })
  })

  return parsedCriteria
}

/**
 * Parse each behavior based on its type
 * @param {Array} behaviors
 * @returns {Array}
 */
const parseBehaviors = (behaviors) => {
  const parsedBehaviors = behaviors.map((behavior) => {
    switch (behavior.name) {
      case 'run_function':
        return {
          name: behavior.name,
          functionId: parseInt(behavior.argument)
        }

      case 'set_waf_ruleset':
        return {
          name: behavior.name,
          mode: behavior.argument.waf_mode,
          waf_id: Number(behavior.argument.set_waf_ruleset_and_waf_mode)
        }
      case 'set_rate_limit':
        return {
          name: behavior.name,
          type: behavior.argument.type,
          limit_by: behavior.argument.limit_by,
          average_rate_limit: behavior.argument.average_rate_limit,
          maximum_burst_size: behavior.argument.maximum_burst_size
        }
      case 'set_custom_response':
        return {
          name: behavior.name,
          status_code: behavior.argument.status_code,
          content_type: behavior.argument.content_type,
          content_body: behavior.argument.content_body
        }
      default:
        return {
          name: behavior.name
        }
    }
  })

  return parsedBehaviors
}

const adapt = ({ body, statusCode }) => {
  if (statusCode !== 200) {
    throw new Error(extractApiError({ body })).message
  }

  const ruleEngine = body.data
  const parsedRuleEngine = {
    id: ruleEngine.id,
    name: ruleEngine.name,
    description: ruleEngine.description,
    active: ruleEngine.active,
    criteria: parseCriteria(ruleEngine.criteria),
    behaviors: parseBehaviors(ruleEngine.behaviors)
  }
  return {
    body: parsedRuleEngine,
    statusCode
  }
}
