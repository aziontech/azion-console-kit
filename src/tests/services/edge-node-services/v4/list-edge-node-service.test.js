import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listEdgeNodeService } from '@/services/edge-node-services/v4'
import { describe, expect, it, vi } from 'vitest'
import { localeMock } from '@/tests/utils/localeMock'

const fixtures = {
  edgeNodeMock: {
    id: 1239875,
    name: 'JS Edge Node',
    hash_id: '128973k#%(J&%@$',
    status: 'active'
  }
}

const makeSut = () => {
  const sut = listEdgeNodeService

  return {
    sut
  }
}

describe('EdgeNodeServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [], count: 0 }
    })
    const { sut } = makeSut()
    const version = 'v4'
    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/orchestrator/edge_nodes?ordering=&page=1&page_size=10&fields=&search=`,
      method: 'GET'
    })
  })

  it('should parsed correctly all returned edge node', async () => {
    localeMock()
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.edgeNodeMock], count: 1 }
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result.body).toEqual([
      {
        id: fixtures.edgeNodeMock.id,
        name: fixtures.edgeNodeMock.name,
        hashId: fixtures.edgeNodeMock.hash_id,
        status: {
          content: 'active',
          severity: 'warning'
        }
      }
    ])
  })
})
