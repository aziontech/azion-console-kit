import { describe, it, expect } from 'vitest'
import { makeGoogleStorageApi } from '@/services/axios/makeGoogleStorageApi'

const makeSut = (baseURL) => {
  const sut = makeGoogleStorageApi(baseURL)

  return {
    sut
  }
}

describe.concurrent('makeGoogleStorageApi', () => {
  it('should create an Axios instance with the correct base URL', async () => {
    const baseURL = 'https://storage.googleapis.com'
    const { sut } = await makeSut(baseURL)

    expect(sut.defaults.baseURL).toBe(baseURL)
  })

  it('should have default headers without Authorization', () => {
    const baseURL = 'https://storage.googleapis.com'
    const { sut } = makeSut(baseURL)
    expect(sut.defaults.headers.common['Authorization']).toBeUndefined()
  })

  it('should set withCredentials to false', () => {
    const baseURL = 'https://storage.googleapis.com'
    const { sut } = makeSut(baseURL)
    expect(sut.defaults.withCredentials).toBe(false)
  })

  it('should return a new Axios instance', () => {
    const { sut } = makeSut('https://storage.googleapis.com')
    expect(sut).toBeInstanceOf(Object)
    expect(sut.defaults.baseURL).toBe('https://storage.googleapis.com')
  })
})
