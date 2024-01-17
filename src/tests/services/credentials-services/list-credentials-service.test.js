import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@services/axios/errors'
import { listCredentialsService } from '@/services/credential-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const localeMock = (locale = 'en') => {
  const DateTimeFormat = Intl.DateTimeFormat
  vi.spyOn(window.global.Intl, 'DateTimeFormat')
    .mockImplementationOnce((__, options) => DateTimeFormat(locale, { ...options }))
    .mockImplementationOnce((__, options) => DateTimeFormat(locale, { ...options }))
}

const fixtures = {
  credentialBasic: {
    id: '1',
    name: 'Cred 1',
    token: 'token123',
    status: true,
    description: 'Some description',
    last_editor: 'custom@email.com',
    last_modified: '2023-10-10T00:00:00Z'
  },
  credentialDisabled: {
    id: '2',
    name: 'Cred 2',
    token: 'token123',
    status: false,
    description: 'Some description',
    last_editor: 'custom@email.com',
    last_modified: '2023-10-11T00:00:00Z'
  }
}

const makeSut = () => {
  const sut = listCredentialsService

  return { sut }
}

describe('ListCredentialsServices', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: []
    })

    const { sut } = makeSut()
    const version = 'v3'
    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/credentials?order_by=name&sort=asc&page=1&page_size=200`,
      method: 'GET'
    })
  })

  it('should parse correctly each returned item', async () => {
    localeMock()
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { credentials: [fixtures.credentialBasic, fixtures.credentialDisabled] }
    })
    const { sut } = makeSut()
    const result = await sut({})
    const [item1, item2] = result

    expect(item1).toEqual({
      id: fixtures.credentialBasic.id,
      name: fixtures.credentialBasic.name,
      token: fixtures.credentialBasic.token,
      status: {
        content: 'Active',
        severity: 'success'
      },
      description: fixtures.credentialBasic.description,
      lastEditor: fixtures.credentialBasic.last_editor,
      lastModified: 'Tuesday, October 10, 2023 at 12:00 AM',
      lastModifiedDate: '2023-10-10T00:00:00Z'
    })

    expect(item2).toEqual({
      id: fixtures.credentialDisabled.id,
      name: fixtures.credentialDisabled.name,
      token: fixtures.credentialDisabled.token,
      status: {
        content: 'Inactive',
        severity: 'danger'
      },
      description: fixtures.credentialDisabled.description,
      lastEditor: fixtures.credentialDisabled.last_editor,
      lastModified: 'Wednesday, October 11, 2023 at 12:00 AM',
      lastModifiedDate: '2023-10-11T00:00:00Z'
    })
  })

  it.each([
    {
      statusCode: 400,
      expectedError: new Errors.InvalidApiRequestError().message
    },
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
      expectedError: new Errors.NotFoundError().message
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
    'should throw when request fails with statusCode $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode,
        body: { results: [] }
      })
      const { sut } = makeSut()

      const response = sut({})

      expect(response).rejects.toBe(expectedError)
    }
  )
})
