import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listIntelligentDNS } from '@/services/real-time-events-service/intelligent-dns'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  filter: {
    tsRange: {
      meta: { option: '1' },
      tsRangeBegin: '2024-02-23T18:07:25',
      tsRangeEnd: '2024-02-23T19:07:25'
    }
  },
  intelligentDns: {
    level: 'ERROR',
    qtype: 'A',
    resolutionType: 'RESOLVED',
    source: 'internal',
    solutionId: 'sol-123',
    ts: '2024-02-23T18:07:25.000Z',
    uuid: 'uuid-12345',
    zoneId: 'zone-67890'
  }
}

const makeSut = () => {
  const sut = listIntelligentDNS

  return {
    sut
  }
}

describe('IntelligentDnsServices', () => {
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
      `    qtype`,
      `    resolutionType`,
      `    source`,
      `    solutionId`,
      `    ts`,
      `    uuid`,
      `    zoneId`,
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
      body: { data: { idnsQueriesEvents: [fixtures.intelligentDns] } }
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
        qtype: fixtures.intelligentDns.qtype,
        resolutionType: fixtures.intelligentDns.resolutionType,
        source: fixtures.intelligentDns.source,
        solutionId: fixtures.intelligentDns.solutionId,
        ts: fixtures.intelligentDns.ts,
        uuid: fixtures.intelligentDns.uuid,
        zoneId: fixtures.intelligentDns.zoneId
      }
    ])
  })
})
