import { ActivityHistoryAdapter } from './activity-history-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'

export const SYNC_INTERVAL_MINUTES = 2

const buildDynamicFilters = (filter = {}) => {
  const normalizeFilterArray = (input) => {
    if (!input) return []
    if (Array.isArray(input)) {
      return input
        .map((item) => ({
          field: item?.field === 'operation' ? 'type' : item?.field,
          value: item?.value
        }))
        .filter((item) => item.field)
    }
    if (typeof input === 'object') {
      return Object.entries(input).map(([field, value]) => ({
        field: field === 'operation' ? 'type' : field,
        value
      }))
    }
    return []
  }

  const allowed = {
    title: { operator: 'Ilike', type: 'String', format: (value) => `%${value}%` },
    comment: { operator: 'Ilike', type: 'String', format: (value) => `%${value}%` },
    type: { operator: 'Eq', type: 'String' },
    authorName: { operator: 'Ilike', type: 'String', format: (value) => `%${value}%` },
    authorEmail: { operator: 'Ilike', type: 'String', format: (value) => `%${value}%` },
    accountId: { operator: 'Eq', type: 'String' },
    resourceId: { operator: 'Eq', type: 'String' },
    resourceType: { operator: 'Ilike', type: 'String', format: (value) => `%${value}%` },
    remoteType: { operator: 'Eq', type: 'String' },
    remotePort: { operator: 'Eq', type: 'Int' },
    userId: { operator: 'Eq', type: 'String' },
    userIp: { operator: 'Eq', type: 'String' },
    userAgent: { operator: 'Ilike', type: 'String', format: (value) => `%${value}%` },
    uuid: { operator: 'Eq', type: 'String' },
    resourceName: { operator: 'Ilike', type: 'String', format: (value) => `%${value}%` }
  }

  const normalized = normalizeFilterArray(filter)
  const occurrenceByField = normalized.reduce((acc, item) => {
    acc[item.field] = (acc[item.field] || 0) + 1
    return acc
  }, {})

  const variableDefs = []
  const filterLines = []
  const orEntries = []
  const variables = {}

  const counterByField = {}
  for (const { field, value: rawValue } of normalized) {
    const rule = allowed[field]
    if (!rule) continue

    const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue
    if (value === '' || value === null || value === undefined) continue

    counterByField[field] = (counterByField[field] || 0) + 1
    const shouldBeOrEntry = occurrenceByField[field] > 1
    const varName = shouldBeOrEntry ? `${field}_${counterByField[field]}` : field

    variableDefs.push(`, $${varName}: ${rule.type}`)
    const formattedValue = rule.format ? rule.format(value) : value
    variables[varName] = rule.type === 'Int' ? Number(formattedValue) : formattedValue

    if (shouldBeOrEntry) {
      orEntries.push(`{ ${field}${rule.operator}: $${varName} }`)
    } else {
      filterLines.push(`${field}${rule.operator}: $${varName}`)
    }
  }

  return {
    variableDefs: variableDefs.join(''),
    andFields: filterLines.length ? `\n            ${filterLines.join('\n            ')}` : '',
    orEntries,
    variables
  }
}

export class ActivityHistoryService extends BaseService {
  constructor() {
    super()
    this.adapter = ActivityHistoryAdapter
    this.baseURL = 'v4/events/graphql'
  }

  #getOffsetDate = ({ intervalDays, intervalMinutes } = {}) => {
    const offSetEnd = new Date()

    let offSetStart
    if (intervalMinutes) {
      offSetStart = new Date(
        Date.UTC(
          offSetEnd.getUTCFullYear(),
          offSetEnd.getUTCMonth(),
          offSetEnd.getUTCDate(),
          offSetEnd.getUTCHours(),
          offSetEnd.getUTCMinutes() - intervalMinutes,
          offSetEnd.getUTCSeconds(),
          offSetEnd.getUTCMilliseconds()
        )
      )
    } else {
      const daysBack = intervalDays ?? 30
      offSetStart = new Date(
        Date.UTC(offSetEnd.getFullYear(), offSetEnd.getMonth(), offSetEnd.getDate() - daysBack)
      )
    }

    return { offSetEnd, offSetStart }
  }

  listActivityHistoryEvents = async ({
    offset = 0,
    limit = 1000,
    search = '',
    dateRange = 30,
    begin,
    end,
    filter = []
  }) => {
    const hasExplicitRange = Boolean(begin && end)
    const { offSetEnd, offSetStart } = hasExplicitRange
      ? { offSetStart: new Date(begin), offSetEnd: new Date(end) }
      : this.#getOffsetDate({ intervalDays: dateRange })

    const dynamic = buildDynamicFilters(filter)
    const combinedOrEntries = [
      ...(search
        ? [
            '{ titleIlike: $search }',
            '{ authorNameIlike: $search }',
            '{ authorEmailIlike: $search }',
            '{ resourceTypeIlike: $search }'
          ]
        : []),
      ...dynamic.orEntries
    ]
    const orClause = combinedOrEntries.length ? `or: [${combinedOrEntries.join(', ')}],` : ''
    const baseQuery = `
      query ActivityHistory(
        $offset: Int, 
        $limit: Int, 
        $begin: DateTime!, 
        $end: DateTime!
        ${search ? ', $search: String' : ''}
        ${dynamic.variableDefs}
      ) {
        activityHistoryEvents(
          offset: $offset, 
          limit: $limit, 
          filter: { 
            tsRange: { begin: $begin, end: $end }
            ${orClause}
            ${dynamic.andFields}
          }, 
          orderBy: [ts_DESC]
        ) { 
          ts
          title
          comment
          type
          authorName
          authorEmail
          accountId
          resourceId
          resourceType
          remotePort
          userId
          userIp
          requestData
          userAgent
          uuid
          resourceName
        }
      }`

    const payload = {
      operationName: 'ActivityHistory',
      query: baseQuery,
      variables: {
        offset,
        limit,
        begin: offSetStart.toISOString(),
        end: offSetEnd.toISOString(),
        ...(search ? { search: `%${search}%` } : {}),
        ...dynamic.variables
      }
    }

    let httpResponse = await this.http.request({
      url: `${this.baseURL}`,
      method: 'POST',
      body: payload
    })

    const parsedEvents = this.adapter.transformListActivityHistoryEvents(httpResponse.data)

    return {
      body: parsedEvents,
      statusCode: httpResponse.statusCode
    }
  }

  listRecentEvents = async ({ intervalMinutes = SYNC_INTERVAL_MINUTES } = {}) => {
    const { offSetEnd, offSetStart } = this.#getOffsetDate({ intervalMinutes })

    const query = `
      query ActivityHistory($begin: DateTime!, $end: DateTime!) {
        activityHistoryEvents(
          limit: 1000,
          filter: { tsRange: { begin: $begin, end: $end } },
          orderBy: [ts_DESC]
        ) {
          ts
          title
          type
        }
      }`

    const payload = {
      operationName: 'ActivityHistory',
      query,
      variables: {
        begin: offSetStart.toISOString(),
        end: offSetEnd.toISOString()
      }
    }

    try {
      const httpResponse = await this.http.request({
        url: this.baseURL,
        method: 'POST',
        body: payload
      })

      const events = httpResponse.data?.data?.activityHistoryEvents || []
      return events.map((event) => event.title)
    } catch {
      return []
    }
  }

  getTotalRecords = async ({ search = '', dateRange = 30, begin, end, filter = [] }) => {
    const hasExplicitRange = Boolean(begin && end)
    const { offSetEnd, offSetStart } = hasExplicitRange
      ? { offSetStart: new Date(begin), offSetEnd: new Date(end) }
      : this.#getOffsetDate({ intervalDays: dateRange })

    const dynamic = buildDynamicFilters(filter)
    const combinedOrEntries = [
      ...(search
        ? [
            '{ titleIlike: $search }',
            '{ authorNameIlike: $search }',
            '{ authorEmailIlike: $search }',
            '{ resourceTypeIlike: $search }'
          ]
        : []),
      ...dynamic.orEntries
    ]
    const orClause = combinedOrEntries.length ? `or: [${combinedOrEntries.join(', ')}],` : ''

    const query = `
      query ActivityHistory(
        $begin: DateTime!, 
        $end: DateTime!
        ${search ? ', $search: String' : ''}
        ${dynamic.variableDefs}
      ) {
        activityHistoryEvents(
          aggregate: { count: rows },
          filter: { 
            tsRange: { begin: $begin, end: $end }
            ${orClause}
            ${dynamic.andFields}
          }
        ) { 
          count 
        }
      }`

    const payload = {
      operationName: 'ActivityHistory',
      query,
      variables: {
        begin: offSetStart.toISOString(),
        end: offSetEnd.toISOString(),
        ...(search ? { search: `%${search}%` } : {}),
        ...dynamic.variables
      }
    }

    let { data: httpResponse } = await this.http.request({
      url: `${this.baseURL}`,
      method: 'POST',
      body: payload
    })

    const totalRecords = httpResponse.data.activityHistoryEvents[0].count

    return totalRecords
  }
}

export const activityHistoryService = new ActivityHistoryService()
