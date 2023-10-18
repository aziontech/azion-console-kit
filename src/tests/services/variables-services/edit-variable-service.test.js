import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editVariableService } from '@/services/variables-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  variableMock: {
    id: 72638,
    key: 'Mongo-DB-Key',
    value: 'M0nG0-t3$$t1n-k3Y',
    secret: true
  }
}

const makeSut = () => {
  const sut = editVariableService

  return {
    sut
  }
}

describe('VariablesServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const { sut } = makeSut()

    await sut(fixtures.variableMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `variables/${fixtures.variableMock.id}`,
      method: 'PUT',
      body: {
        key: fixtures.variableMock.key,
        value: fixtures.variableMock.value,
        secret: fixtures.variableMock.secret
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.variableMock)

    expect(feedbackMessage).toBe('Resource successfully updated')
  })
})
