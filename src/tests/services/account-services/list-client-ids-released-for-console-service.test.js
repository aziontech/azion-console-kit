import { listClientIdsReleasedForConsoleService } from '@/services/account-services'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = listClientIdsReleasedForConsoleService

  return {
    sut
  }
}

describe.concurrent('AccountServices', () => {
  it('should call the API service with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { client_ids: ['id1', 'id2'] }
    })

    const { sut } = makeSut()

    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: '/github'
    })
  })

  it('should return an array of client IDs when successful', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { client_ids: ['id1', 'id2'] }
    })

    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual(['id1', 'id2'])
  })

  it('should return an empty array when response body is not an array', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { client_ids: 'not an array' }
    })

    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual([])
  })
})