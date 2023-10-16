import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { createCredentialService } from '@/services/credential-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  basic: {
    name: 'Cred A',
    description: 'Some description'
  }
}

const makeSut = () => {
  const sut = createCredentialService

  return {
    sut
  }
}

describe('CreateCredentialServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    await sut(fixtures.basic)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `credentials`,
      method: 'POST',
      body: {
        name: fixtures.basic.name,
        description: fixtures.basic.description,
        status: true
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.basic)

    expect(feedbackMessage).toBe('Resource successfully created')
  })
})
