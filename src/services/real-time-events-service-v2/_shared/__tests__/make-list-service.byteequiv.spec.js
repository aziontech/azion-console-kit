import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { localeMock } from '@/tests/utils/localeMock'
import { listEdgeDNS } from '@/services/real-time-events-service-v2/edge-dns'
import { listTieredCache } from '@/services/real-time-events-service-v2/tiered-cache'
import { listImageProcessor } from '@/services/real-time-events-service-v2/image-processor'
import { listActivityHistory } from '@/services/real-time-events-service-v2/activity-history'
import { listEdgeFunctions } from '@/services/real-time-events-service-v2/edge-functions'
import { listEdgeFunctionsConsole } from '@/services/real-time-events-service-v2/edge-functions-console'
import { listDataStream } from '@/services/real-time-events-service-v2/data-stream'

vi.mock('@/helpers/generate-timestamp', () => ({
  generateCurrentTimestamp: () => 'mocked-timestamp'
}))

const filter = {
  tsRange: {
    meta: { option: '1' },
    tsRangeBegin: '2024-02-23T18:07:25',
    tsRangeEnd: '2024-02-23T19:07:25'
  }
}

const baseEvent = { ts: '2024-02-23T18:07:25.000Z' }

/**
 * Byte-parity guard for the makeListService factory: each service must emit
 * its row keys in the exact legacy order (JSON.stringify is order-sensitive),
 * and the empty-dataset shape must match the pre-refactor behavior.
 */
const cases = [
  {
    name: 'edgeDnsQueriesEvents',
    sut: listEdgeDNS,
    keys: ['id', 'summary', 'ts', 'tsFormat', 'uuid']
  },
  {
    name: 'tieredCacheEvents',
    sut: listTieredCache,
    keys: ['configurationId', 'host', 'proxyHost', 'id', 'summary', 'ts', 'tsFormat']
  },
  {
    name: 'imagesProcessedEvents',
    sut: listImageProcessor,
    keys: ['id', 'configurationId', 'httpUserAgent', 'httpReferer', 'summary', 'ts', 'tsFormat']
  },
  {
    name: 'activityHistoryEvents',
    sut: listActivityHistory,
    keys: ['id', 'summary', 'userId', 'ts', 'tsFormat']
  },
  {
    name: 'functionEvents',
    sut: listEdgeFunctions,
    keys: ['id', 'summary', 'ts', 'tsFormat', 'configurationId']
  },
  {
    name: 'functionConsoleEvents',
    sut: listEdgeFunctionsConsole,
    keys: ['summary', 'configurationId', 'line', 'id', 'tsFormat', 'ts']
  },
  {
    name: 'dataStreamedEvents',
    sut: listDataStream,
    keys: ['configurationId', 'id', 'summary', 'ts', 'tsFormat']
  }
]

describe('makeListService · byte-parity (key order per dataset)', () => {
  beforeEach(() => localeMock())

  it.each(cases)('$name preserves the legacy row key order', async ({ name, sut, keys }) => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { [name]: [{ ...baseEvent }] } }
    })

    const response = await sut(filter)

    expect(Object.keys(response.data[0])).toEqual(keys)
  })
})

describe('makeListService · empty-dataset shape parity', () => {
  it('standard services yield undefined data when the dataset is absent', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: {} }
    })

    const response = await listEdgeDNS(filter)

    expect(JSON.stringify(response)).toBe('{}')
  })

  it('edge-functions-console yields an empty array when the dataset is absent', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: {} }
    })

    const response = await listEdgeFunctionsConsole(filter)

    expect(JSON.stringify(response)).toBe('{"data":[]}')
  })
})
