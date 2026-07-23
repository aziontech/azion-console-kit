// @vitest-environment node
import { describe, it, expect, afterEach, vi } from 'vitest'
import { MFAService } from '@/services/v2/mfa/mfa-service'
import { spyHttpRequest } from '../../../support/versioning/boundaries'

/**
 * MFA service (test-maturity fase 2 — auth area, previously 0% covered).
 * Real service + real adapter; only the HTTP boundary is stubbed.
 */
afterEach(() => {
  vi.restoreAllMocks()
})

describe('listMfaService', () => {
  it('GETs v4/auth/mfa/totp with the given params and adapts each user', async () => {
    const http = spyHttpRequest()
    http.respondWith({
      count: 2,
      results: [
        { id: 1, name: 'Ana', email: 'ana@azion.com', confirmed: true },
        { id: 2, name: 'Bia', email: 'bia@azion.com', confirmed: false }
      ]
    })

    const result = await new MFAService().listMfaService({ pageSize: 25 })

    const [request] = http.spy.mock.calls.at(-1)
    expect(request).toMatchObject({
      method: 'GET',
      url: 'v4/auth/mfa/totp',
      params: { pageSize: 25 }
    })
    expect(result.count).toBe(2)
    expect(result.body).toEqual([
      {
        id: 1,
        name: 'Ana',
        email: 'ana@azion.com',
        confirmed: { content: 'Confirmed', severity: 'success' }
      },
      {
        id: 2,
        name: 'Bia',
        email: 'bia@azion.com',
        confirmed: { content: 'Not Confirmed', severity: 'danger' }
      }
    ])
  })

  it('defaults to pageSize 10 when no params are given', async () => {
    const http = spyHttpRequest()
    http.respondWith({ count: 0, results: [] })

    await new MFAService().listMfaService()

    expect(http.spy.mock.calls.at(-1)[0].params).toEqual({ pageSize: 10 })
  })
})

describe('deleteMfaService', () => {
  it('DELETEs the totp entry by id and returns the feedback message', async () => {
    const http = spyHttpRequest()
    http.respondWith({})

    const feedback = await new MFAService().deleteMfaService(77)

    expect(http.spy.mock.calls.at(-1)[0]).toMatchObject({
      method: 'DELETE',
      url: 'v4/auth/mfa/totp/77'
    })
    expect(feedback).toBe('MFA successfully deleted')
  })
})
