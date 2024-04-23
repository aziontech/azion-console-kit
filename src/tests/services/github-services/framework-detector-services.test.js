import { describe, expect, it, vi, afterEach } from 'vitest'
import { frameworkDetectorService } from '@/services/github-services/framework-detector-services'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { Buffer } from 'buffer'

const fixtures = {
  mockHttpResponse: {
    statusCode: 200,
    body: {
      content: 'encodedPackageJsonContent'
    }
  },
  mockAdaptedResponse: {
    body: 'next',
    statusCode: 200
  },
  mockPackageJson: {
    dependencies: {
      next: '^17.0.2',
      react: '^3.0.0'
    }
  },
  axiosInstanceMock: {
    defaults: {
      headers: {
        common: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      }
    }
  }
}

vi.mock('@/services/axios/makeGithubApi', () => {
  return { default: vi.fn(() => fixtures.axiosInstanceMock) }
})

const makeSut = () => {
  const sut = frameworkDetectorService
  return {
    sut
  }
}

describe('GithubServices', () => {
  it('should call GitHub API with correct params', async () => {
    vi.spyOn(Buffer, 'from').mockReturnValueOnce(JSON.stringify(fixtures.mockPackageJson))
    const requestSpy = vi
      .spyOn(AxiosHttpClientAdapter, 'request')
      .mockResolvedValueOnce(fixtures.mockHttpResponse)

    const { sut } = makeSut()
    await sut({ accountName: 'testAccount', repositoryName: 'testRepo' })

    expect(requestSpy).toHaveBeenCalledWith(
      {
        url: '/repos/testAccount/testRepo/contents/package.json',
        method: 'GET'
      },
      fixtures.axiosInstanceMock
    )
  })

  it('should return correct framework on success', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce(fixtures.mockHttpResponse)
    vi.spyOn(Buffer, 'from').mockReturnValueOnce(JSON.stringify(fixtures.mockPackageJson))

    const { sut } = makeSut()

    const result = await sut({ accountName: 'testAccount', repositoryName: 'testRepo' })

    expect(result).toEqual(fixtures.mockAdaptedResponse.body)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })
})
