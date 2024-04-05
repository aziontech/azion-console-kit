import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listPlatformsService } from '@/services/version-control-system-integration-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  versionControlSystemMock: {
    id: '1',
    name: '7283j-j2j3l2-82736823-j2k4m2',
    installation_url: 'https://github.com/install',
    callback_url: 'https://api-teste.com/v4/vcs/integrations/oauth/github/callback'
  }
}

const makeSut = () => {
  const sut = listPlatformsService

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

    const { sut } = makeSut()
    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v4/vcs/platforms',
      method: 'GET'
    })
  })

  it('should parsed correctly each platforms', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.versionControlSystemMock] }
    })
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual([
      {
        id: fixtures.versionControlSystemMock.id,
        name: fixtures.versionControlSystemMock.name,
        installationUrl: fixtures.versionControlSystemMock.installation_url,
        callbackUrl: fixtures.versionControlSystemMock.callback_url.split('vcs')[1]
      }
    ])
  })
})
