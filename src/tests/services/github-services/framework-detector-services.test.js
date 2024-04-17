import { describe, expect, it, vi, afterEach } from 'vitest'
import { frameworkDetectorService } from '@/services/github-services/framework-detector-services'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { Buffer } from 'buffer'

const fixtures = {
  mockHttpResponse: {
    statusCode: 200,
    body: {
      content: 'encodedPackageJsonContent'
    }
  },
  mockAdaptedResponse: {
    body: 'nextjs',
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

  it.each([
    {
      statusCode: 401,
      expectedError: new Errors.InvalidApiTokenError().message
    },
    {
      statusCode: 403,
      expectedError: new Errors.PermissionError().message
    },
    {
      statusCode: 404,
      expectedError: 'This repository has no package.json, please try another one.'
    },
    {
      statusCode: 500,
      expectedError: new Errors.InternalServerError().message
    },
    {
      statusCode: 'unmappedStatusCode',
      expectedError: new Errors.UnexpectedError().message
    }
  ])(
    'should throw when GitHub API request fails with status code $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode,
        body: {}
      })
      const { sut } = makeSut()

      const request = sut({ accountName: 'testAccount', repositoryName: 'testRepo' })

      await expect(request).rejects.toThrow(expectedError)
    }
  )

  afterEach(() => {
    vi.restoreAllMocks()
  })
})
