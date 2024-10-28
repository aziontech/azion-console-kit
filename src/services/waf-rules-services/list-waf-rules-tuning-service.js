import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeWafRulesBaseUrl } from './make-waf-rules-base-url'
import * as Errors from '@/services/axios/errors'

export const listWafRulesTuningService = async ({ wafId, domains, network, hourRange, filter }) => {
  if (!wafId) {
    return parseHttpResponse({
      body: [],
      statusCode: 200
    })
  }

  const { countries, ipsList } = middleware(filter)
  const searchParams = makeSearchParams({ domains, network, countries, ipsList, hourRange })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeWafRulesBaseUrl()}/${wafId}/waf_events?${searchParams}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (httpResponse) => {
  return httpResponse.body.errors[0].message
}

const middleware = (filter) => {
  if (!filter?.length) return { countries: null, ipsList: null }

  const countries = filter
    .find((item) => item.valueField === 'country')
    ?.value.map((item) => item.name)

  const ipsListIn =
    filter.find((item) => item.valueField === 'ip_address' && item.operator === 'In')?.value || []

  const ipsListEquals = filter.find(
    (item) => item.valueField === 'ip_address' && item.operator === 'Eq'
  )?.value

  const ipsList = [...ipsListIn]

  if (ipsListEquals) {
    ipsList.push(ipsListEquals)
  }

  return {
    countries,
    ipsList
  }
}

const adapt = (httpResponse) => {
  /**
   * Necessary until the API gets the common pattern
   * of returning the array of data inside results property
   * like other andpoints.
   */

  if (httpResponse.statusCode !== 200) return httpResponse

  const isArray = Array.isArray(httpResponse.body.results)
  const parsedWafRulesTuning = isArray
    ? httpResponse.body.results.map((event) => {
        const values = {
          hitCount: event.hit_count,
          topIps: event?.top_10_ips?.[0]?.[1] || '',
          id: event.rule_id,
          ruleId: event.rule_id,
          ruleIdDescription: `${event.rule_id} - ${event.rule_description}`,
          ipCount: event.ip_count,
          matchZone: event.match_zone,
          pathCount: event.path_count,
          topCountries: event?.top_10_countries?.[0]?.[1],
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

const makeSearchParams = ({ domains, network, countries, ipsList, hourRange }) => {
  const searchParams = new URLSearchParams()
  domains && searchParams.set('domains_ids', domains)
  network && searchParams.set('network_list_id', network)
  ipsList && searchParams.set('ips_list', ipsList)
  countries && searchParams.set('countries_list', countries)
  hourRange && searchParams.set('hour_range', hourRange)

  return searchParams
}

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return httpResponse.body
    case 400:
      const apiError = extractApiError(httpResponse)
      throw new Error(apiError).message
    case 404:
      throw new Errors.NotFoundError().message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}
