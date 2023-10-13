import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { createVariablesService } from '@/services/variables-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  variableMock: {
    key: 'Mongo-DB-Key',
    value: 'M0nG0-t3$$t1n-k3Y'
  }
}

const makeSut = () => {
  const sut = createVariablesService

  return {
    sut
  }
}

describe('VariablesServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    await sut(fixtures.variableMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `variables`,
      method: 'POST',
      body: {
        key: fixtures.variableMock.key,
        value: fixtures.variableMock.value
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.variableMock)

    expect(feedbackMessage).toBe('Resource successfully created')
  })
})
