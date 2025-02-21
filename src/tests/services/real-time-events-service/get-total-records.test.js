import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { getTotalRecords } from '@/services/real-time-events-service/get-total-records'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  filter: {
    tsRange: {
      meta: { option: '1' },
      tsRangeBegin: '2024-02-23T18:07:25',
      tsRangeEnd: '2024-02-23T19:07:25'
    }
  },
  httpRequest: {
    count: 100000
  }
}

const makeSut = () => {
  const sut = getTotalRecords

  return {
    sut
  }
}

describe('getTotalRecords', () => {
  it('should call GraphQL with correct filter', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { events: [{ count: 0 }] } }
    })
    const { sut } = makeSut()
    const datasetName = 'events'
    await sut({ filter: fixtures.filter, dataset: datasetName })

    const query = [
      `query (`,
      `\t$tsRange_begin: DateTime!`,
      `\t$tsRange_end: DateTime!`,
      `) {`,
      `\t${datasetName} (`,
      `\t\tlimit: 10000`,
      `\t\taggregate: {`,
      `count: rows`,
      `\t\t}`,
      `\t\tfilter: {`,
      `\t\t\ttsRange: { begin: $tsRange_begin, end: $tsRange_end }`,
      `\t\t}`,
      `\t) {`,
      `\t\tcount`,
      `\t}`,
      `}`
    ].join('\n')

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v3/events/graphql',
      method: 'POST',
      signal: undefined,
      body: {
        query,
        variables: {
          tsRange_begin: '2024-02-23T18:07:25',
          tsRange_end: '2024-02-23T19:07:25'
        }
      },
      headers: undefined
    })
  })

  it('should parsed correctly each event', async () => {
    vi.mock('@/helpers/generate-timestamp', () => ({
      generateCurrentTimestamp: () => 'mocked-timestamp'
    }))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { httpEvents: [fixtures.httpRequest] } }
    })
    const datasetName = 'httpEvents'

    const { sut } = makeSut()
    const response = await sut({ filter: fixtures.filter, dataset: datasetName })

    expect(response).toEqual('100.000')
  })
})
