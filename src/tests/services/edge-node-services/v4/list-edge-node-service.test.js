import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listEdgeNodeService } from '@/services/edge-node-services/v4'
import { describe, expect, it, vi } from 'vitest'
import { localeMock } from '@/tests/utils/localeMock'

const fixtures = {
  edgeNodeMock: {
    id: 1239875,
    name: 'JS Edge Node',
    hash_id: '128973k#%(J&%@$',
    status: 'waiting_authorization'
  }
}

const makeSut = () => {
  const sut = listEdgeNodeService

  return {
    sut
  }
}

describe('EdgeNodeServicesV4', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { nodes: [] }
    })
    const { sut } = makeSut()
    const version = 'v4'
    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_orchestrator/edge_nodes?ordering=name&page=1&page_size=10&fields=&search=`,
      method: 'GET'
    })
  })

  it('should parsed correctly all returned firewalls', async () => {
    localeMock()
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.edgeNodeMock] }
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual([
      {
        id: fixtures.edgeNodeMock.id,
        name: fixtures.edgeNodeMock.name,
        hashId: fixtures.edgeNodeMock.hash_id,
        status: {
          content: 'Waiting Authorization',
          severity: 'warning'
        }
      }
    ])
  })
})
