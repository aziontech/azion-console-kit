import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadEdgeDNS } from '@/services/real-time-events-service/edge-dns'
import { describe, expect, it, vi } from 'vitest'
import { localeMock } from '@/tests/utils/localeMock'

const fixtures = {
  filter: {
    tsRange: {
      meta: { option: '1' },
      tsRangeBegin: '2024-02-23T18:07:25',
      tsRangeEnd: '2024-02-23T19:07:25'
    }
  },
  edgeDns: {
    level: 'ERROR',
    qtype: 'A',
    resolutionType: 'RESOLVED',
    source: 'internal',
    solutionId: 'sol-123',
    ts: '2024-02-23T18:07:25.000Z',
    uuid: 'uuid-12345',
    zoneId: 'zone-67890',
    statusCode: 200
  }
}

const makeSut = () => {
  const sut = loadEdgeDNS

  return {
    sut
  }
}

describe('ImageProcessorServices', () => {
  it('should call GraphQL with correct filter', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { idnsQueriesEvents: [] } }
    })
    const { sut } = makeSut()
    await sut(fixtures.filter)

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v4/events/graphql',
      method: 'POST',
      signal: undefined,
      body: {
        query: expect.any(String),
        variables: {
          tsRange_begin: '2024-02-23T18:07:25',
          tsRange_end: '2024-02-23T19:07:25'
        }
      },
      headers: undefined
    })
  })

  it('should parsed correctly each event', async () => {
    localeMock()
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { idnsQueriesEvents: [fixtures.edgeDns] } }
    })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)

    expect(response).toEqual({
      level: {
        content: 'Error',
        icon: 'pi pi-times-circle',
        severity: 'danger'
      },
      qtype: fixtures.edgeDns.qtype,
      resolutionType: fixtures.edgeDns.resolutionType,
      qTypeDescription:
        'Address Mapping record (A Record), also known as a DNS host record, stores a hostname and its corresponding IPv4 address.',
      solutionId: fixtures.edgeDns.solutionId,
      ts: fixtures.edgeDns.ts,
      uuid: fixtures.edgeDns.uuid,
      zoneId: fixtures.edgeDns.zoneId,
      statusCode: fixtures.edgeDns.statusCode
    })
  })
})
