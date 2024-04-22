import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listRepositoriesService } from '@/services/version-control-system-integration-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  repositoryMock: {
    id: 'repo1',
    name: 'repository-test',
    full_name: 'test/repository-test',
    private: false
  },
  uuid: '7283j-j2j3l2-82736823-j2k4m2'
}

const makeSut = () => {
  const sut = listRepositoriesService

  return {
    sut
  }
}

describe('VersionControlSystemService', () => {
  it('should call api with correct uuid', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.repositoryMock] }
    })

    const { sut } = makeSut()
    await sut(fixtures.uuid)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/vcs/integrations/${fixtures.uuid}/repositories?page_size=200`,
      method: 'GET'
    })
  })

  it('should return the parsed repositories', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.repositoryMock] }
    })

    const { sut } = makeSut()

    const result = await sut(fixtures.uuid)

    expect(result).toEqual([fixtures.repositoryMock])
  })
})