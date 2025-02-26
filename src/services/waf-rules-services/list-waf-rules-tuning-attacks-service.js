import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeWafRulesBaseUrl } from './make-waf-rules-base-url'

export const listWafRulesTuningAttacksService = async ({ wafId, tuningId, query }) => {
  const trimmedTuningId = tuningId.toString().slice(0, -1)

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeWafRulesBaseUrl()}/${wafId}/waf_events/${trimmedTuningId}${query}`,
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
          topIps: event.top_10_ips.map((ip) => `${ip.ip} (${ip.hits} hits)`),
          id: index,
          ruleId: parseInt(event.rule_id),
          ipCount: event.ip_count,
          matchZone: event.match_zone,
          pathCount: event.path_count,
          topCountries: event.top_10_countries.map(
            (country) => `${country.country} (${country.hits} hits)`
          ),
          matchesOn: event.matches_on,
          countryCount: event.country_count,
          topPaths: event.top_10_paths.map((path) => `${path.path} (${path.hits} hits)`),
          matchValue: event.match_value
        }

        return values
      })
    : []

  return {
    body: parsedWafRulesTuning,
    statusCode: httpResponse.statusCode
  }
}
