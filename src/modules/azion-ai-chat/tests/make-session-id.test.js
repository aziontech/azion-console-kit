import { describe, expect, it } from 'vitest'
import * as sessionIdController from '../services/make-session-id'

const makeSut = () => {
  return {
    sut: sessionIdController
  }
}

describe('makeSessionId', () => {
  it('should generate a session ID', () => {
    const { sut } = makeSut()

    const result = sut.makeSessionId()

    expect(result).not.toBeUndefined()
  })

  it('should update session ID', () => {
    const { sut } = makeSut()
    let initialSessionId
    let updatedSessionid
    initialSessionId = sut.makeSessionId()

    updatedSessionid = sut.updateSessionId()

    expect(initialSessionId).not.toEqual(updatedSessionid)
  })

  it('should return same session ID', () => {
    const { sut } = makeSut()
    const firstResult = sut.makeSessionId()
    const secondResult = sut.makeSessionId()

    expect(firstResult).toEqual(secondResult)
  })
})
