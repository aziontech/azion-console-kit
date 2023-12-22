import { describe, expect, it } from 'vitest'
import { getFirstApiError } from '@/helpers'

const makeSut = () => {
  const sut = getFirstApiError

  return {
    sut
  }
}

describe('getFirstApiError', () => {
  it('should return the first api error key', () => {
    const { sut } = makeSut()

    const environment = sut([[{ error: 'sample error 1' }], [{ errorTwo: 'sample error 2' }]])

    expect(environment).toStrictEqual({ error: 'sample error 1' })
  })
  it('should not return another api error', () => {
    const { sut } = makeSut()

    const environment = sut([[{ error: 'sample error 1' }], [{ errorTwo: 'sample error 2' }]])

    expect(environment).not.toStrictEqual({ error: 'sample error 2' })
  })
  it('should not return null for not valid array', () => {
    const { sut } = makeSut()

    const environment = sut([])

    expect(environment).toStrictEqual(null)
  })
})
