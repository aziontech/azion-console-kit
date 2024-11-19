import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listWorkloadsService } from '@/services/workloads-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  workloadsSample: {
    id: '123',
    name: 'teste',
    test_parser: 'test_parser'
  }
}

const makeSut = () => {
  const sut = listWorkloadsService

  return { sut }
}

describe('EdgeApplicationDeviceGroupsServicesV4', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })

    const { sut } = makeSut()
    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/workspace/workloads?ordering=name&page=1&page_size=200&fields=&search=`,
      method: 'GET'
    })
  })

  it('should parse correctly each returned item', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [fixtures.workloadsSample],
        count: 3000
      }
    })

    const { sut } = makeSut()
    const result = await sut({})

    expect(result).toEqual({
      count: 3000,
      results: [
        {
          id: fixtures.workloadsSample.id,
          name: fixtures.workloadsSample.name,
          testParser: fixtures.workloadsSample.test_parser
        }
      ]
    })
  })

  it('should throw when request fails with status code different from 200', async () => {
    const apiErrorMock = {
      error: 'api error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 403,
      body: apiErrorMock
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut({})

    expect(apiErrorResponse).rejects.toBe(apiErrorMock.error)
  })
})
