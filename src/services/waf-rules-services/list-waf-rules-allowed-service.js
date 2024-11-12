import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeWafRulesAllowedBaseUrl } from './make-waf-rules-allowed-base-url'
import { optionsRuleIds } from './ruleIdOptions'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listWafRulesAllowedService = async ({
  wafId,
  fields = '',
  search = '',
  ordering = '',
  page = 1,
  pageSize = 10
}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeWafRulesAllowedBaseUrl()}/${wafId}/exceptions?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const parseStatusData = (status) => {
  const parsedStatus = status
    ? {
        content: 'Active',
        severity: 'success'
      }
    : {
        content: 'Inactive',
        severity: 'danger'
      }

  return parsedStatus
}

const replaceString = (str, value) => {
  return str.replace('$value', value)
}

const parseMatchZone = (waf) => {
  const arrayMatchZone = []

  const zones = {
    query_string: 'Query String$value',
    raw_body: 'Raw Body',
    request_body: 'Request Body$value',
    request_header: 'Request Header$value',
    path: 'Path',
    file_name: 'File Name (Multipart Body)',
    conditional_request_header: 'Conditional Request Header$value',
    conditional_request_body: 'Conditional Request Body$value',
    conditional_query_string: 'Conditional Query String$value'
  }

  let value = ''
  for (const matchZone of waf) {
    value = zones[matchZone.zone]
    if (matchZone.zone_input) {
      if (matchZone.matches_on === 'value')
        value = replaceString(value, `: ${matchZone.zone_input} (Value)`)
      if (matchZone.matches_on === 'name')
        value = replaceString(value, `: ${matchZone.zone_input} (Name)`)
    } else if (matchZone.matches_on) {
      if (matchZone.matches_on === 'value') value = replaceString(value, ' (Value)')
      if (matchZone.matches_on === 'name') value = replaceString(value, ' (Name)')
    }

    arrayMatchZone.push(value)
  }

  return arrayMatchZone
}

const adapt = (httpResponse) => {
  /**
   * Necessary until the API gets the common pattern
   * of returning the array of data inside results property
   * like other andpoints.
   */

  const isArray = Array.isArray(httpResponse.body.results)

  const parsedWafRulesAllowed = isArray
    ? httpResponse.body.results.map((waf) => {
        const ruleId = optionsRuleIds.find((rule) => rule.value === waf.rule_id).text
        const parsedAllowed = {
          id: waf.id,
          lastEditor: waf.last_editor,
          lastModified: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
            new Date(waf.last_modified)
          ),
          matchZones: parseMatchZone(waf.match_zones),
          path: waf.path,
          description: waf.description,
          ruleId,
          status: parseStatusData(waf.active),
          useRegex: waf.use_regex
        }

        return parsedAllowed
      })
    : []

  const count = httpResponse.body?.count ?? 0

  return {
    count,
    body: parsedWafRulesAllowed,
    statusCode: httpResponse.statusCode
  }
}
