import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editEdgeNodeService } from '@/services/edge-node-services/v4'

import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

const fixtures = {
  mock: {
    id: 13,
    edgeServiceID: 1987867,
    name: 'Az-dns',
    status: true,
    hasServices: false
  }
}

const makeSut = () => {
  const sut = editEdgeNodeService

  return {
    sut
  }
}

describe('EdgeNodeServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const { sut } = makeSut()
    const version = 'v4'
    await sut(fixtures.mock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_orchestrator/edge_nodes/${fixtures.mock.id}`,
      method: 'PATCH',
      body: {
        name: 'Az-dns',
        status: true,
        modules: {
          has_services: false
        }
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.mock)

    expect(feedbackMessage).toBe('Your edge node has been updated')
  })

  it('should throw internal server error when request fails with 500 status code', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500,
      body: { results: 'Internal server error' }
    })

    const { sut } = makeSut()
    const promise = sut(fixtures.mock)

    await expect(promise).rejects.toBe(new Errors.InternalServerError().message)
  })

  it('should throw API error when request fails with non-500 status code', async () => {
    const apiErrorMock = {
      results: 'api error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: apiErrorMock
    })

    const { sut } = makeSut()
    const promise = sut(fixtures.mock)

    await expect(promise).rejects.toBe('Unknown error occurred')
  })
})
