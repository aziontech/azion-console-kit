import { getDateRangeByHourRange } from '@/helpers/convert-date'
import { wafService } from '@/services/v2/waf/waf-service'
import { WafRulesTuningGqlAdapter } from './waf-rules-tuning-gql-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'

export class WafRulesTuningGqlService extends BaseService {
  constructor() {
    super()
    this.adapter = WafRulesTuningGqlAdapter
    this.baseURL = 'v4/events/graphql'
  }

  listWafRulesAllowed = async (params) => {
    const { pageSize = 100, concurrency = 3, ...rest } = params

    const firstPage = await wafService.listWafRulesAllowed({
      page: 1,
      pageSize,
      fields: ['rule_id', 'conditions', 'active', 'operator', 'last_modified'],
      ...rest
    })

    const totalPages = Math.ceil(firstPage.count / pageSize)
    const allItems = [...firstPage.body]

    if (totalPages <= 1) {
      return allItems
    }

    const pagePromises = []

    for (let page = 2; page <= totalPages; page++) {
      pagePromises.push(
        wafService
          .listWafRulesAllowed({
            page,
            pageSize,
            ...rest
          })
          .then((data) => ({ page, items: data.body }))
      )
    }

    const results = []

    // eslint-disable-next-line id-length
    for (let pageIndex = 0; pageIndex < pagePromises.length; pageIndex += concurrency) {
      const batch = pagePromises.slice(pageIndex, pageIndex + concurrency)
      const batchResults = await Promise.allSettled(batch)

      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(...result.value.items)
        }
      })
    }

    results
      .sort((current, previous) => current.page - previous.page)
      .forEach((result) => allItems.push(...result.items))

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

    if (query.domains && query.domains.length) {
      queryParams.push('$host: [String]')
      filters.push('hostIn: $host')
      variables.host = query.domains
    }

    if (tuningId) {
      queryParams.push('$wafMatchLike: String')
      filters.push('wafMatchLike: $wafMatchLike')
      variables.wafMatchLike = `%:${tuningId}:%`
    }

    if (query.countries && query.countries.length) {
      queryParams.push('$geolocCountryNameIn: [String]')
      filters.push('geolocCountryNameIn: $geolocCountryNameIn')
      variables.geolocCountryNameIn = query.countries
    }

    if (query.ip) {
      queryParams.push('$remoteAddress: String')
      filters.push('remoteAddress: $remoteAddress')
      variables.remoteAddress = query.ip
    }

    if (query.ipsList && query.ipsList.length) {
      queryParams.push('$remoteAddressIn: [String]')
      filters.push('remoteAddressIn: $remoteAddressIn')
      variables.remoteAddressIn = query.ipsList
    }

    if (query.pathsList && query.pathsList.length) {
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
    if (!params?.wafId) return { data: [], recordsFound: 0 }

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
              limit: 10000,
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
    return this.adapter.transformWafRulesTuningAttacks(data, params?.tuningId)
  }
}

export const wafRulesTuningGqlService = new WafRulesTuningGqlService()
