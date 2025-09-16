export class ActivityHistoryService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/events/graphql'
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
    const baseQuery = `
      query ActivityHistory(
        $offset: Int, 
        $limit: Int, 
        $begin: DateTime!, 
        $end: DateTime!
        ${search ? ', $search: String' : ''}
      ) {
        activityHistoryEvents(
          offset: $offset, 
          limit: $limit, 
          filter: { 
            tsRange: { begin: $begin, end: $end }
            ${search ? 'or: [{ titleIlike: $search }, { commentIlike: $search }],' : ''}
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
        ...(search ? { search: `%${search}%` } : {})
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

  getTotalRecords = async ({ search = '' }) => {
    const { offSetEnd, offSetStart } = this.#getOffsetDate()

    const query = `
      query ActivityHistory(
        $begin: DateTime!, 
        $end: DateTime!
        ${search ? ', $search: String' : ''}
      ) {
        activityHistoryEvents(
          aggregate: { count: rows },
          filter: { 
            tsRange: { begin: $begin, end: $end }
            ${search ? 'or: [{ titleIlike: $search }, { commentIlike: $search }],' : ''}
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
        ...(search ? { search: `%${search}%` } : {})
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
