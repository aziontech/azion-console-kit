export class ActivityHistoryService {
  constructor(http, adapter, apiClient) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/events/graphql'
    this.apiClient = apiClient
  }

  #getOffsetDate = () => {
    const offSetEnd = new Date()
    const offSetStart = new Date(
      Date.UTC(offSetEnd.getFullYear(), offSetEnd.getMonth(), offSetEnd.getDate() - 30)
    )
    return { offSetEnd, offSetStart }
  }

  listActivityHistoryEvents = async ({ offset = 0, limit = 1000, search = '' }) => {
    const { offSetEnd, offSetStart } = this.#getOffsetDate()

    const payload = {
      operatioName: 'ActivityHistory',
      query: `query ActivityHistory ($offset: Int, $limit: Int, $begin: DateTime!, $end: DateTime!) { activityHistoryEvents( offset: $offset limit: $limit, filter: { tsRange: {begin: $begin, end: $end, } }, orderBy: [ts_DESC] ) { ts title comment type authorName authorEmail accountId } } `,
      variables: {
        offset,
        limit,
        begin: offSetStart.toISOString(),
        end: offSetEnd.toISOString()
      }
    }

    if (search) {
      payload.query = `query ActivityHistory ($offset: Int, $limit: Int, $begin: DateTime!, $end: DateTime!, $search: String) { activityHistoryEvents( offset: $offset limit: $limit, filter: { tsRange: {begin: $begin, end: $end, } or: [{ titleIlike: $search }, { commentIlike: $search }], }, orderBy: [ts_DESC] ) { ts title comment type authorName authorEmail accountId } } `
      payload.variables.search = `%${search}%`
    }
    let httpResponse = await this.http.request(
      {
        url: `${this.baseURL}`,
        method: 'POST',
        body: payload
      },
      this.apiClient
    )

    const parsedEvents = this.adapter.transformListActivityHistoryEvents(httpResponse.data)

    return {
      body: parsedEvents,
      statusCode: httpResponse.statusCode
    }
  }

  getTotalRecords = async ({ search = '' }) => {
    const { offSetEnd, offSetStart } = this.#getOffsetDate()

    const payload = {
      operatioName: 'ActivityHistory',
      query: `query ActivityHistory ($begin: DateTime!, $end: DateTime!) { activityHistoryEvents(aggregate: { count: rows }, filter: { tsRange: {begin: $begin, end: $end } }) { count } } `,
      variables: {
        begin: offSetStart.toISOString(),
        end: offSetEnd.toISOString()
      }
    }

    if (search) {
      payload.query = `query ActivityHistory ($begin: DateTime!, $end: DateTime!, $search: String) { activityHistoryEvents (aggregate: { count: rows }, filter: { tsRange: {begin: $begin, end: $end } or: [{ titleIlike: $search }, { commentIlike: $search }], }) { count } } `
      payload.variables.search = `%${search}%`
    }

    let { data: httpResponse } = await this.http.request(
      {
        url: `${this.baseURL}`,
        method: 'POST',
        body: payload
      },
      this.apiClient
    )

    const totalRecords = httpResponse.data.activityHistoryEvents[0].count

    return totalRecords
  }
}
