import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listGroupsEdgeNodeService } from '@/services/edge-node-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeNodeMock: {
    groups: [
      { name: 'Group 1', id: 1 },
      { name: 'Group 2', id: 2 }
    ]
  }
}

const makeSut = () => {
  const sut = listGroupsEdgeNodeService

  return {
    sut
  }
}

describe('EdgeNodeServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: []
    })
    const { sut } = makeSut()

    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `edge_node/groups`,
      method: 'GET'
    })
  })

  it('should parsed correctly all returned firewalls', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.edgeNodeMock.groups
    })
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual([
      {
        id: 1,
        name: 'Group 1'
      },
      {
        id: 2,
        name: 'Group 2'
      }
    ])
  })
})
