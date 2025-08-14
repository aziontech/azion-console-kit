export class ActivityHistoryService {
  constructor(http, adapter, apiClient) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/events/graphql'
    this.apiClient = apiClient
  }

  listActivityHistoryEvents = async ({ offset = 0, limit = 1000, search = '' }) => {
    const offSetEnd = new Date()
    const offSetStart = new Date(
      Date.UTC(offSetEnd.getFullYear(), offSetEnd.getMonth(), offSetEnd.getDate() - 30)
    )
    const payload = {
      operatioName: 'ActivityHistory',
      query: `query ActivityHistory { activityHistoryEvents( offset: ${offset} limit: ${limit}, filter: { tsRange: {begin:"${offSetStart.toISOString()}", end:"${offSetEnd.toISOString()}", } }, orderBy: [ts_DESC] ) { ts title comment type authorName authorEmail accountId } } `
    }

    if (search) {
      payload.query = `query ActivityHistory { activityHistoryEvents( offset: ${offset} limit: ${limit}, filter: { tsRange: {begin:"${offSetStart.toISOString()}", end:"${offSetEnd.toISOString()}", } or: [{ titleIlike: "%${search}%" }, { commentIlike: "%${search}%" }], }, orderBy: [ts_DESC] ) { ts title comment type authorName authorEmail accountId } } `
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
    const offSetEnd = new Date()
    const offSetStart = new Date(
      Date.UTC(offSetEnd.getFullYear(), offSetEnd.getMonth(), offSetEnd.getDate() - 30)
    )
    const payload = {
      operatioName: 'ActivityHistory',
      query: `query ActivityHistory { activityHistoryEvents(aggregate: { count: rows }, filter: { tsRange: {begin:"${offSetStart.toISOString()}", end:"${offSetEnd.toISOString()}" } }) { count } } `
    }

    if (search) {
      payload.query = `query ActivityHistory { activityHistoryEvents (aggregate: { count: rows }, filter: { tsRange: {begin:"${offSetStart.toISOString()}", end:"${offSetEnd.toISOString()}" } or: [{ titleIlike: "%${search}%" }, { commentIlike: "%${search}%" }], }) { count } } `
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
