import { parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import {
  InternalServerError,
  InvalidApiRequestError,
  InvalidApiTokenError,
  NotFoundError,
  PermissionError,
  UnexpectedError
} from '@/services/axios/errors'

import { describe, expect, it } from 'vitest'

const makeSut = () => {
  const sut = parseHttpResponse
  return {
    sut
  }
}

describe('ParseHttpResponse', () => {
  it('should return body when response is 200', () => {
    const httpResponseMock = {
      statusCode: 200,
      body: {
        name: 'Azion',
        address: 'azion street'
      }
    }
    const { sut } = makeSut()

    const result = sut(httpResponseMock)

    expect(result).toStrictEqual({
      name: httpResponseMock.body.name,
      address: httpResponseMock.body.address
    })
  })
  it('should return null when response is 200 and no content is provided in the response', () => {
    const httpResponseMock = {
      statusCode: 200,
      body: undefined
    }
    const { sut } = makeSut()

    const result = sut(httpResponseMock)

    expect(result).toBeNull()
  })
  it('should return a successfully created message on status code 201', () => {
    const httpResponseMock = {
      statusCode: 201
    }
    const { sut } = makeSut()

    const result = sut(httpResponseMock)

    expect(result).toBe('Resource successfully created')
  })
  it('should return a successfully updated message status code 202', () => {
    const httpResponseMock = {
      statusCode: 202
    }
    const { sut } = makeSut()

    const result = sut(httpResponseMock)

    expect(result).toBe('Resource successfully updated')
  })
  it('should return a successfully deleted message on status code 204', () => {
    const httpResponseMock = {
      statusCode: 204
    }
    const { sut } = makeSut()

    const result = sut(httpResponseMock)

    expect(result).toBe('Resource successfully deleted')
  })
  it('should throw an error on get invalid response schema', () => {
    const responseMock = {
      code: 200,
      content: {
        name: 'john'
      }
    }
    const { sut } = makeSut()

    expect(() => sut(responseMock)).toThrow(new UnexpectedError().message)
  })
  it.each([
    {
      statusCode: 400,
      expectedError: new InvalidApiRequestError().message
    },
    {
      statusCode: 401,
      expectedError: new InvalidApiTokenError().message
    },
    {
      statusCode: 403,
      expectedError: new PermissionError().message
    },
    {
      statusCode: 404,
      expectedError: new NotFoundError().message
    },
    {
      statusCode: 500,
      expectedError: new InternalServerError().message
    },
    {
      statusCode: 'unmappedStatusCode',
      expectedError: new UnexpectedError().message
    }
  ])(
    'should throw error message when request fails with statusCode $statusCode',
    async ({ statusCode, expectedError }) => {
      const responseMock = {
        statusCode,
        body: null
      }
      const { sut } = makeSut()

      expect(() => sut(responseMock)).toThrow(expectedError)
    }
  )
})
