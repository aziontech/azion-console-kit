import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { deleteVariablesService } from '@/services/variables-services'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = deleteVariablesService

  return {
    sut
  }
}

describe('VariablesServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const environmentVariableIdMock = 765678
    const { sut } = makeSut()

    await sut(environmentVariableIdMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `variables/${environmentVariableIdMock}`,
      method: 'DELETE'
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const environmentVariableIdMock = 7816825367
    const { sut } = makeSut()

    const feedbackMessage = await sut(environmentVariableIdMock)

    expect(feedbackMessage).toBe('Resource successfully deleted')
  })
})
