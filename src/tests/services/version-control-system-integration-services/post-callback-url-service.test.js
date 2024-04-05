import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { postCallbackUrlService } from '@/services/version-control-system-integration-services'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = postCallbackUrlService

  return {
    sut
  }
}

describe('VersionControlSystemService', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })

    const path = '/integrations/oauth/github/callback'
    const body = { data: { value: 123 } }

    const { sut } = makeSut()
    await sut(path, body)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `vcs${path}`,
      method: 'POST',
      body: {
        data: { value: 123 }
      }
    })
  })
})
