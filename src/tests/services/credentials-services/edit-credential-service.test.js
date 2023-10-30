import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editCredentialService } from '@/services/credential-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  basic: {
    id: 1,
    name: 'Cred A',
    description: 'Some description',
    status: true
  }
}

const makeSut = () => {
  const sut = editCredentialService

  return {
    sut
  }
}

describe('CredentialServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    await sut(fixtures.basic)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `credentials/${fixtures.basic.id}`,
      method: 'PATCH',
      body: {
        name: fixtures.basic.name,
        description: fixtures.basic.description,
        status: fixtures.basic.status
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.basic)

    expect(feedbackMessage).toBe('Your credential has been updated')
  })
})
