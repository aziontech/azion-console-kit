import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { deleteFunctionService } from '@/services/edge-application-functions-services'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = deleteFunctionService

  return {
    sut
  }
}

describe('EdgeApplicationFunctionsServices', () => {
  it('should call Api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const edgeApplicationId = 321
    const functionId = 123
    const { sut } = makeSut()
    const version = 'v3'
    await sut(functionId, edgeApplicationId)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'DELETE',
      url: `${version}/edge_applications/${edgeApplicationId}/functions_instances/${functionId}`
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const edgeApplicationId = 123
    const functionId = 321

    const { sut } = makeSut()

    const feedbackMessage = await sut(functionId, edgeApplicationId)

    expect(feedbackMessage).toBe('Resource successfully deleted')
  })
})
