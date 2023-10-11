import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { deletePersonalToken } from '@/services/personal-tokens-services'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = deletePersonalToken

  return {
    sut
  }
}

describe('PersonalTokensServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const { sut } = makeSut()
    const personalTokenIdMock = 987678

    await sut(personalTokenIdMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `iam/personal_tokens/${personalTokenIdMock}`,
      method: 'DELETE'
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const personalTokenIdMock = 987678
    const { sut } = makeSut()

    const feedbackMessage = await sut(personalTokenIdMock)

    expect(feedbackMessage).toBe('Resource successfully deleted')
  })
})
