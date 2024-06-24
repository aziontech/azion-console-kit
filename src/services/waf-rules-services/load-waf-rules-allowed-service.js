import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeWafRulesAllowedBaseUrl } from './make-waf-rules-allowed-base-url'

export const loadWafRulesAllowedService = async ({ id, allowedId }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeWafRulesAllowedBaseUrl()}/${id}/allowed_rules/${allowedId.id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parsedWafRules = {
    matchZones: httpResponse.body.data.match_zones,
    path: httpResponse.body.data.path,
    reason: httpResponse.body.data.description,
    ruleId: httpResponse.body.data.rule_id,
    status: httpResponse.body.data.status,
    useRegex: httpResponse.body.data.use_regex
  }

  return {
    body: parsedWafRules,
    statusCode: httpResponse.statusCode
  }
}
