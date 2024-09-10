import { describe, expect, it, vi, afterEach } from 'vitest'
import { createFeedbackServices } from '@/services/feedback-services/feedback-services'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'

const fixtures = {
  mockPayload: {
    type: 'bug',
    account_id: '123',
    client_id: '456',
    name: 'João Silva',
    email: 'joao@exemplo.com',
    description: 'Descrição do problema'
  },
  mockHttpResponse: {
    statusCode: 200
  },
  axiosInstanceMock: {
    defaults: {
      headers: {
        common: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      }
    }
  }
}

vi.mock('@/services/axios/AxiosHttpClientAdapter', () => ({
  AxiosHttpClientAdapter: {
    request: vi.fn()
  }
}))

const makeSut = () => {
  const sut = createFeedbackServices
  return {
    sut
  }
}

describe('FeedbackServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi
      .spyOn(AxiosHttpClientAdapter, 'request')
      .mockResolvedValueOnce(fixtures.mockHttpResponse)

    const { sut } = makeSut()
    await sut(fixtures.mockPayload)

    expect(requestSpy).toHaveBeenCalledWith({
      url: '/webhook/console_feedback',
      method: 'POST',
      body: fixtures.mockPayload
    })
  })

  it('should return correct status code on success', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce(fixtures.mockHttpResponse)

    const { sut } = makeSut()
    const result = await sut(fixtures.mockPayload)

    expect(result).toBe(200)
  })

  it('should throw an error for status 400', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({ statusCode: 400 })

    const { sut } = makeSut()
    await expect(sut(fixtures.mockPayload)).rejects.toThrow('Error sending feedback')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })
})
