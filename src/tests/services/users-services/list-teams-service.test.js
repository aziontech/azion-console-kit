import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listTeamsService } from '@/services/users-services'
import { describe, expect, it, vi } from 'vitest'
import { InvalidDataStructureError } from '@/services/axios/errors'

const fixtures = {
  teamsMock: {
    results: [
      {
        id: 1,
        is_active: true,
        name: 'test team',
        permissions: [
          {
            group: 'default_permissions 1',
            id: 1,
            name: 'View Content Delivery Settings',
            slug: 'user:edit'
          }
        ]
      },
      {
        id: 2,
        is_active: true,
        name: 'test team',
        permissions: [
          {
            group: 'default_permissions 2',
            id: 2,
            name: 'View Content Delivery Settings',
            slug: 'content_delivery:read'
          }
        ]
      }
    ]
  }
}

const makeSut = () => {
  const sut = listTeamsService

  return {
    sut
  }
}

describe('UsersServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: []
      }
    })

    const { sut } = makeSut()
    const version = 'v4'
    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/iam/teams?ordering=name&page=1&page_size=100&fields=&search=`,
      method: 'GET'
    })
  })

  it('should parsed correctly each teams', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.teamsMock
    })
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual([
      {
        label: 'test team',
        value: 1
      },
      {
        label: 'test team',
        value: 2
      }
    ])
  })
  it('should throw if response body is not an array', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: undefined
    })
    const { sut } = makeSut()

    const response = sut()

    expect(response).rejects.toThrow(new InvalidDataStructureError().message)
  })
})
