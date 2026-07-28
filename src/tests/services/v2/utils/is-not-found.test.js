import { describe, expect, it } from 'vitest'
import { isNotFound } from '@/services/v2/utils/is-not-found'

describe('isNotFound', () => {
  it('detects the shape ErrorHandler.create produces (.status)', () => {
    expect(isNotFound({ status: 404 })).toBe(true)
  })

  it('detects a raw axios error (.response.status)', () => {
    expect(isNotFound({ response: { status: 404 } })).toBe(true)
  })

  it('detects the legacy .statusCode shape', () => {
    expect(isNotFound({ statusCode: 404 })).toBe(true)
  })

  it('does not swallow other failures', () => {
    expect(isNotFound({ status: 500 })).toBe(false)
    expect(isNotFound({ status: 403 })).toBe(false)
    expect(isNotFound({ response: { status: 502 } })).toBe(false)
  })

  it('is safe on null/undefined', () => {
    expect(isNotFound(null)).toBe(false)
    expect(isNotFound(undefined)).toBe(false)
    expect(isNotFound({})).toBe(false)
  })
})
