import { listClientIdsReleasedForConsoleService } from '@/services/account-services'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { getEnvironment } from '@/helpers/get-environment'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/helpers/get-environment')

const makeSut = () => {
  const sut = listClientIdsReleasedForConsoleService
  return { sut }
}

describe('AccountServices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call the API service with the correct parameters', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { production: { client_ids: ['id1', 'id2'] }, stage: { client_ids: ['id3', 'id4'] } }
    })
    getEnvironment.mockReturnValue('production')

    const { sut } = makeSut()
    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: '/allowed-accounts'
    })
  })

  it('should return an array of production client IDs when the environment is production', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { production: { client_ids: ['id1', 'id2'] }, stage: { client_ids: ['id3', 'id4'] } }
    })
    getEnvironment.mockReturnValue('production')

    const { sut } = makeSut()
    const result = await sut()

    expect(result).toEqual(['id1', 'id2'])
  })

  it('should return an array of stage client IDs when the environment is not production', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { production: { client_ids: ['id1', 'id2'] }, stage: { client_ids: ['id3', 'id4'] } }
    })
    getEnvironment.mockReturnValue('stage')

    const { sut } = makeSut()
    const result = await sut()

    expect(result).toEqual(['id3', 'id4'])
  })

  it('should return an empty array when the response body does not contain client_ids', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { production: {}, stage: {} }
    })
    getEnvironment.mockReturnValue('production')

    const { sut } = makeSut()
    const result = await sut()

    expect(result).toEqual([])
  })
})