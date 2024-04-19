import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listIntegrationsService } from '@/services/version-control-system-integration-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  vcsMock: {
    scope: 'scopeteste',
    uuid: '7283j-j2j3l2-82736823-j2k4m2',
    platform: {
      callback_url: 'https://api-teste.com/v4/vcs/integrations/oauth/github/callback'
    }
  }
}

const makeSut = () => {
  const sut = listIntegrationsService

  return {
    sut
  }
}

describe('VersionControlSystemService', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: null
    })

    const { sut } = makeSut()
    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v4/vcs/integrations',
      method: 'GET'
    })
  })

  it('should parsed correctly each integrations', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.vcsMock] }
    })
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual([
      {
        label: fixtures.vcsMock.scope,
        value: fixtures.vcsMock.uuid,
        callbackUrl: fixtures.vcsMock.platform.callback_url.split('vcs')[1]
      }
    ])
  })
})
