import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadCredentialService } from '@/services/credential-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fixtures = {
  basic: {
    id: 1,
    name: 'Cred A',
    description: 'Some description',
    status: true,
    last_editor: 'custom@email.com',
    last_modified: '2023-10-10T00:00:00Z'
  }
}

const makeSut = () => {
  const sut = loadCredentialService

  return {
    sut
  }
}

describe('CredentialService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {}
    })

    const { sut } = makeSut()
    await sut(fixtures.basic)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `credentials/${fixtures.basic.id}`,
      method: 'GET'
    })
  })

  it('should parse correctly each returned item', async () => {
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.basic
    })

    const { sut } = makeSut()
    const result = await sut({})

    expect(result).toEqual({
      id: fixtures.basic.id,
      name: fixtures.basic.name,
      token: fixtures.basic.token,
      status: fixtures.basic.status,
      description: fixtures.basic.description,
      lastEditor: fixtures.basic.last_editor,
      lastModified: fixtures.basic.last_modified
    })
  })
})
