import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeFirewallRulesEngineBaseUrl } from './make-edge-firewall-rules-engine-base-url'

export const loadEdgeFirewallRulesEngineService = async ({ id, edgeFirewallId }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFirewallRulesEngineBaseUrl(edgeFirewallId)}/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

/**
 * Parse each criteria based on its type
 * @param {Array} criterias
 * @returns {Array}
 */
const parseCriterias = (criterias) => {
  const parsedCriterias = criterias.map((criteriaGroup) => {
    return criteriaGroup.map((criteria) => {
      switch (criteria.variable) {
        case 'network':
          return {
            ...criteria,
            argument: criteria.argument.toString()
          }
        default:
          return criteria
      }
    })
  })

  return parsedCriterias
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

      case 'set_waf_ruleset_and_waf_mode':
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

const adapt = (httpResponse) => {
  const ruleEngine = httpResponse.body.results
  const parsedRuleEngine = {
    id: ruleEngine.id,
    name: ruleEngine.name,
    description: ruleEngine.description,
    active: ruleEngine.is_active,
    criteria: parseCriterias(ruleEngine.criteria),
    behaviors: parseBehaviors(ruleEngine.behaviors)
  }
  return {
    body: parsedRuleEngine,
    statusCode: httpResponse.statusCode
  }
}
