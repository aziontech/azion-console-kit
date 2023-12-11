import makeBeholderGQL from '@services/axios/makeBeholderGQL'
import { describe, expect, it } from 'vitest'

const makeSut = () => {
  const sut = makeBeholderGQL

  return {
    sut
  }
}

describe('makeGraphQl', () => {
  it('should have default headers set', () => {
    const { sut } = makeSut()

    expect(sut.defaults.headers.common['Accept']).toBe('application/json, text/plain, */*')
  })

  it('should have the correct base URL', () => {
    const { sut } = makeSut()

    expect(sut.defaults.baseURL).toBe('/metrics/graphql')
  })
})
