import { describe, expect, it } from 'vitest'
import { requestInterceptorService } from '../services/request-interceptor-service'

const makeSut = () => {
  return {
    sut: requestInterceptorService
  }
}

describe('requestInterceptorService', () => {
  it('should return undefined if requestDetails.body is not provided', () => {
    const { sut } = makeSut()
    const requestDetails = {}

    const result = sut(requestDetails, {
      sessionId: '123',
      url: '/test-url',
      userName: 'testUser',
      clientId: 'client123',
      allMessage: [],
      prompt: null
    })

    expect(result).toBeUndefined()
  })

  it('should modify requestDetails.body with valid data', () => {
    const { sut } = makeSut()
    const requestDetails = { body: {} }

    const result = sut(requestDetails, {
      sessionId: '123',
      url: '/test-url',
      userName: 'testUser',
      clientId: 'client123',
      allMessage: [{ role: 'user', text: 'Hello' }],
      prompt: { user_prompt: 'User prompt', system_prompt: 'System prompt' }
    })

    expect(result.body).toEqual({
      messages: [{ role: 'user', content: 'Hello' }],
      stream: true,
      azion: {
        session_id: '123',
        user_name: 'testUser',
        client_id: 'client123',
        url: '/test-url',
        app: 'console',
        user_prompt: 'User prompt',
        system_prompt: 'System prompt'
      }
    })
  })

  it('should handle different roles in allMessage', () => {
    const { sut } = makeSut()
    const requestDetails = { body: {} }

    const result = sut(requestDetails, {
      sessionId: '123',
      url: '/test-url',
      userName: 'testUser',
      clientId: 'client123',
      allMessage: [
        { role: 'user', text: 'Hello' },
        { role: 'system', text: 'System message' }
      ],
      prompt: null
    })

    expect(result.body.messages).toEqual([
      { role: 'user', content: 'Hello' },
      { role: 'system', content: 'System message' }
    ])
  })

  it('should handle when prompt is not provided', () => {
    const { sut } = makeSut()
    const requestDetails = { body: {} }

    const result = sut(requestDetails, {
      sessionId: '123',
      url: '/test-url',
      userName: 'testUser',
      clientId: 'client123',
      allMessage: [{ role: 'user', text: 'Hello' }],
      prompt: null
    })

    expect(result.body.azion).toEqual({
      session_id: '123',
      user_name: 'testUser',
      client_id: 'client123',
      url: '/test-url',
      app: 'console'
    })
  })
})
