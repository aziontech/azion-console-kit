import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listEdgeNodeService } from '@/services/edge-node-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeNodeMock: {
    id: 1239875,
    name: 'JS Edge Node',
    groups: 'Group 1',
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
      body: { nodes: [] }
    })
    const { sut } = makeSut()

    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `edge_node`,
      method: 'GET'
    })
  })

  it('should parsed correctly all returned firewalls', async () => {
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { nodes: [fixtures.edgeNodeMock] }
    })
    const { sut } = makeSut()

    const domains = await sut({})

    expect(domains).toEqual([
      {
        id: fixtures.edgeNodeMock.id,
        name: fixtures.edgeNodeMock.name,
        groups: fixtures.edgeNodeMock.groups,
        hashId: fixtures.edgeNodeMock.hash_id,
        status: fixtures.edgeNodeMock.status
      }
    ])
  })
})
