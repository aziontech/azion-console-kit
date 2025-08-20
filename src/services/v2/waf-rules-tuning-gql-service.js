import { getDateRangeByHourRange } from '@/helpers/convert-date'
import { wafService } from './index'

export class WafRulesTuningGqlService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/events/graphql'
  }

  listWafRulesAllowed = async (params) => {
    const { pageSize = 100, ...rest } = params
    let page = 1
    let allItems = []

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const data = await wafService.listWafRulesAllowed({
        page,
        pageSize,
        ...rest
      })
      const { body, count } = data

      allItems = [...allItems, ...body]

      if (allItems.length >= count) {
        break
      }

      page++
    }

    return allItems
  }

  buildWafRulesTuningFilters = (query, tuningId) => {
    const { hourRange = '1' } = query
    const date = getDateRangeByHourRange(hourRange)
    const queryParams = ['$tsRange_begin: DateTime!', '$tsRange_end: DateTime!']
    const filters = ['tsRange: { begin: $tsRange_begin, end: $tsRange_end }']
    const variables = {
      tsRange_begin: date.startDate,
      tsRange_end: date.endDate
    }

    if (query.domains && query.domains.length > 0) {
      queryParams.push('$host: [String]')
      filters.push('hostIn: $host')
      variables.host = query.domains
    }

    if (tuningId) {
      queryParams.push('$wafMatchLike: String')
      filters.push('wafMatchLike: $wafMatchLike')
      variables.wafMatchLike = `%:${tuningId}:%`
    }

    if (query.countries && query.countries.length > 0) {
      queryParams.push('$geolocCountryNameIn: [String]')
      filters.push('geolocCountryNameIn: $geolocCountryNameIn')
      variables.geolocCountryNameIn = query.countries
    }

    if (query.ip) {
      queryParams.push('$remoteAddress: String')
      filters.push('remoteAddress: $remoteAddress')
      variables.remoteAddress = query.ip
    }

    if (query.ipsList && query.ipsList.length > 0) {
      queryParams.push('$remoteAddressIn: [String]')
      filters.push('remoteAddressIn: $remoteAddressIn')
      variables.remoteAddressIn = query.ipsList
    }

    if (query.pathsList && query.pathsList.length > 0) {
      queryParams.push('$requestUriIn: [String]')
      filters.push('requestUriIn: $requestUriIn')
      variables.requestUriIn = query.pathsList
    }

    return {
      queryParams,
      filters,
      variables
    }
  }

  listWafRulesTuning = async (params) => {
    let allowedRules = []
    if (params?.wafId) {
      allowedRules = await this.listWafRulesAllowed(params)
    }
    const { queryParams, filters, variables } = this.buildWafRulesTuningFilters(params)

    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}`,
      body: {
        query: `
          query wafEvents (${queryParams.join(', ')}) {
            logs: httpEvents(
              limit: 10,
              filter: {
                ${filters.join('\n                ')}
              }
              aggregate: { count: wafMatch }
              orderBy: [wafMatch_DESC, remoteAddress_DESC, geolocCountryName_DESC],
              groupBy: [wafMatch, remoteAddress, requestUri, geolocCountryName]
            )
            {
              ruleId: wafMatch,
              count
              ip: remoteAddress,
              country: geolocCountryName,
              path: requestUri
            }
          }
        `,
        variables
      }
    })
    return this.adapter.transformWafRulesTuning(data, allowedRules)
  }

  listWafRulesTuningAttacks = async (params) => {
    const { query, tuningId } = params
    const { queryParams, filters, variables } = this.buildWafRulesTuningFilters(query, tuningId)

    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}`,
      body: {
        query: `
          query wafEvents (${queryParams.join(', ')}) {
            logs: httpEvents(
              limit: 10000,
              filter: {
                ${filters.join('\n                ')}
              }
              aggregate: { count: wafMatch }
              orderBy: [wafMatch_DESC, remoteAddress_DESC, requestUri_DESC, geolocCountryName_DESC],
              groupBy: [wafMatch, remoteAddress, requestUri, geolocCountryName]
            )
            {
              ruleId: wafMatch,
              count
              ip: remoteAddress,
              country: geolocCountryName,
              path: requestUri
            }
          }
        `,
        variables
      }
    })
    return this.adapter.transformWafRulesTuningAttacks(data)
  }
}
