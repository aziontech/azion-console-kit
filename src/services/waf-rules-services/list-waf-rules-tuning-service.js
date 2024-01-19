import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeWafRulesBaseUrl } from './make-waf-rules-base-url'

export const listWafRulesTuningService = async ({ wafId, query }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeWafRulesBaseUrl()}/${wafId}/waf_events${query}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  /**
   * Necessary until the API gets the common pattern
   * of returning the array of data inside results property
   * like other andpoints.
   */

  // eslint-disable-next-line no-console
  const isArray = Array.isArray(httpResponse.body.results)


  const parsedWafRulesTuning = isArray
  ? httpResponse.body.results.map((event, index) => {
      const values = {
        hitCount: event.hit_count,
        topIps: event.top_10_ips,
        id: index,
        ruleId: event.rule_id,
        ruleIdDescription: `${event.rule_id} - ${event.rule_description}`,
        ipCount: event.ip_count,
        matchZone: event.match_zone,
        pathCount: event.path_count,
        topCountries: event.top_10_countries,
        matchesOn: event.matches_on,
        ruleDescription: event.rule_description,
        countryCount: event.country_count
      }

      return values
    })
  : []

  return {
    body: parsedWafRulesTuning,
    statusCode: httpResponse.statusCode
  }
}
