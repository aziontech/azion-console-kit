import api from '@/services/axios/makeApi'
import { it, describe, assert, expect } from 'vitest'

const makeSut = ({ token }) => {
  const sut = api(token)

  return {
    sut
  }
}

describe.concurrent('MakeApi', () => {
  it('should have default headers set', () => {
    const { sut } = makeSut({})
    assert.equal(sut.defaults.headers.common['Accept'], 'application/json; version=3')
    assert.equal(sut.defaults.withCredentials, true)
  })

  it('should have the correct base URL', () => {
    const { sut } = makeSut({})

    assert.equal(sut.defaults.baseURL, '/api')
  })
  it('should set Authorization header when a token is provided', () => {
    const personalTokenMock = 'r4nd0m-testing-token'
    const { sut } = makeSut({ token: personalTokenMock })
    assert.equal(sut.defaults.headers.common['Authorization'], `token ${personalTokenMock}`)
  })

  it('should not set Authorization header when no token is provided', () => {
    const { sut } = makeSut({})

    expect(sut.defaults.headers.common['Authorization']).toBeUndefined()
  })
})
