import api from '@/services/axios/makeApi'
import { it, describe, expect } from 'vitest'

const makeSut = ({ token }) => {
  const sut = api(token)

  return {
    sut
  }
}

describe.concurrent('MakeApi', () => {
  it('should have default headers set', () => {
    const { sut } = makeSut({})

    expect(sut.defaults.headers.common['Accept']).toBe('application/json; version=3')
    expect(sut.defaults.withCredentials).toBe(true)
  })

  it('should have the correct base URL', () => {
    const { sut } = makeSut({})

    expect(sut.defaults.baseURL).toBe('/api')
  })
  it('should set Authorization header when a token is provided', () => {
    const personalTokenMock = 'r4nd0m-testing-token'
    const { sut } = makeSut({ token: personalTokenMock })

    expect(sut.defaults.headers.common['Authorization']).toBe(`token ${personalTokenMock}`)
  })

  it('should not set Authorization header when no token is provided', () => {
    const { sut } = makeSut({})

    expect(sut.defaults.headers.common['Authorization']).toBeUndefined()
  })
})
