import { describe, expect, it } from 'vitest'
import { requestInterceptorService } from '../services/request-interceptor-service'

const makeSut = () => {
  return {
    sut: requestInterceptorService
  }
}

describe('requestInterceptorService', () => {
  it('should add correct properties to the request', () => {
    const { sut } = makeSut()
    const requestDetailsMock = {
      body: {}
    }
    const sessionIdMock = '123'
    const urlMock = 'https://example.com'
    const userNameMock = 'john'

    const result = sut(requestDetailsMock, {
      sessionId: sessionIdMock,
      url: urlMock,
      userName: userNameMock
    })

    expect(result.body.session_id).toEqual(sessionIdMock)
    expect(result.body.url).toEqual(urlMock)
    expect(result.body.username).toEqual(userNameMock)
    expect(result.body.app).toEqual('console')
  })

  it('should not modify the request when its undefined', () => {
    const { sut } = makeSut()
    const sessionIdMock = '123'
    const urlMock = 'https://example.com'
    const userNameMock = 'john'

    const result = sut(undefined, {
      sessionId: sessionIdMock,
      url: urlMock,
      userName: userNameMock
    })

    expect(result).toBeUndefined()
  })

  it('should not modify the request when its empty', () => {
    const { sut } = makeSut()
    const requestDetailsMock = {}
    const sessionIdMock = '123'
    const urlMock = 'https://example.com'
    const userNameMock = 'john'

    const result = sut(requestDetailsMock, {
      sessionId: sessionIdMock,
      url: urlMock,
      userName: userNameMock
    })
    expect(result).toBeUndefined()
  })
})
