import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listEdgeDNS } from '@/services/real-time-events-service/edge-dns'
import { describe, expect, it, vi } from 'vitest'

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
    zoneId: 'zone-67890',
    qtype: 'A',
    resolutionType: 'RESOLVED',
    solutionId: 'sol-123',
    ts: '2024-02-23T18:07:25.000Z',
    source: 'internal',
    uuid: 'uuid-12345'
  }
}

const makeSut = () => {
  const sut = listEdgeDNS

  return {
    sut
  }
}

describe('edgeDns', () => {
  it('should call GraphQL with correct filter', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { httpRequest: [] } }
    })
    const { sut } = makeSut()
    const datasetName = 'idnsQueriesEvents'
    await sut(fixtures.filter)

    const query = [
      `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!) {`,
      `  ${datasetName} (`,
      `    limit: 10000`,
      `    orderBy: [ts_ASC]`,
      `    filter: {`,
      `      tsRange: { begin: $tsRange_begin, end: $tsRange_end }`,
      `    }`,
      `  ) {`,
      `    level`,
      `    zoneId`,
      `    qtype`,
      `    resolutionType`,
      `    solutionId`,
      `    ts`,
      `    source`,
      `    uuid`,
      `  }`,
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
      body: { data: { idnsQueriesEvents: [fixtures.edgeDns] } }
    })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)

    expect(response).toEqual([
      {
        id: 'mocked-timestamp',
        level: {
          content: 'Error',
          icon: 'pi pi-times-circle',
          severity: 'danger'
        },
        qtype: fixtures.edgeDns.qtype,
        resolutionType: fixtures.edgeDns.resolutionType,
        source: fixtures.edgeDns.source,
        solutionId: fixtures.edgeDns.solutionId,
        ts: fixtures.edgeDns.ts,
        tsFormat: 'February 23, 2024 at 06:07 PM',
        uuid: fixtures.edgeDns.uuid,
        zoneId: fixtures.edgeDns.zoneId
      }
    ])
  })
})
