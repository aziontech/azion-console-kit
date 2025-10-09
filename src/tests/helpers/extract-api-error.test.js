import { describe, expect, it } from 'vitest'
import { extractApiError } from '@/helpers/extract-api-error'

const makeSut = () => {
  const sut = extractApiError

  return {
    sut
  }
}

describe('extractApiError', () => {
  it('should return detail message for generic error', () => {
    const { sut } = makeSut()
    const httpResponse = {
      body: {
        detail: 'Not found.'
      }
    }

    const result = sut(httpResponse)

    expect(result).toBe('Not found.')
  })

  it('should return field error message for validation error', () => {
    const { sut } = makeSut()
    const httpResponse = {
      body: {
        name: ['Name already in use.']
      }
    }

    const result = sut(httpResponse)

    expect(result).toBe('name: Name already in use.')
  })

  it('should return nested field error message without parent object name', () => {
    const { sut } = makeSut()
    const httpResponse = {
      body: {
        modules: {
          edge_cache_enabled: ['Must be a valid boolean.']
        }
      }
    }

    const result = sut(httpResponse)

    expect(result).toBe('edge_cache_enabled: Must be a valid boolean.')
  })

  it('should return unknown error when no error message is found', () => {
    const { sut } = makeSut()
    const httpResponse = {
      body: {}
    }

    const result = sut(httpResponse)

    expect(result).toBe('Unknown error occurred')
  })
})
