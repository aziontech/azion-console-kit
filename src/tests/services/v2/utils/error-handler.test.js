// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { ErrorHandler } from '@/services/v2/utils/errorHandler'

/**
 * ErrorHandler — every API failure in the v2 layer flows through here before
 * reaching the user (test-maturity, deep pass). Covers message extraction,
 * the {field}/offending_refs composition, pointer→label formatting, the meta
 * envelope and the toast fan-out surface.
 */
const axiosError = (status, data, message = 'Request failed') => {
  const error = new Error(message)
  if (status) error.response = { status, data }
  return error
}

describe('create — status, code and message extraction', () => {
  it('maps a network failure (no response) to the connection-error message with status 500', () => {
    const handler = ErrorHandler.create(new Error('Network Error'))

    expect(handler.status).toBe(500)
    expect(handler.message).toEqual([
      'Unable to connect to the server. Please check your internet connection.'
    ])
  })

  it('keeps the HTTP status and the error code from the axios error', () => {
    const raw = axiosError(429, { errors: [{ detail: 'slow down' }] })
    raw.code = 'ERR_BAD_RESPONSE'

    const handler = ErrorHandler.create(raw)

    expect(handler.status).toBe(429)
    expect(handler.code).toBe('ERR_BAD_RESPONSE')
  })

  it('produces one message per API error entry', () => {
    const handler = ErrorHandler.create(
      axiosError(400, { errors: [{ detail: 'first' }, { detail: 'second' }] })
    )

    expect(handler.message).toEqual(['first', 'second'])
  })

  it('falls back to the raw error message when the body has no errors array', () => {
    const handler = ErrorHandler.create(axiosError(502, { unexpected: true }, 'Bad gateway'))

    expect(handler.message).toEqual(['Bad gateway'])
  })
})

describe('create — message composition (the API error grammar)', () => {
  it('prefixes the field label derived from the JSON pointer', () => {
    const handler = ErrorHandler.create(
      axiosError(400, {
        errors: [{ detail: 'must be unique', source: { pointer: '/data/name' } }]
      })
    )

    expect(handler.message).toEqual(['Name: must be unique'])
  })

  it('formats nested pointers as breadcrumbs (/data/tls/certificate → Tls - Certificate)', () => {
    const handler = ErrorHandler.create(
      axiosError(400, {
        errors: [{ detail: 'is invalid', source: { pointer: '/data/tls/certificate' } }]
      })
    )

    expect(handler.message).toEqual(['Tls - Certificate: is invalid'])
  })

  it('substitutes {field} with the humanized offending resource types', () => {
    const handler = ErrorHandler.create(
      axiosError(400, {
        errors: [
          {
            detail: 'The {field} is in another deployment',
            meta: { offending_refs: [{ resource_type: 'edge_firewall' }] }
          }
        ]
      })
    )

    expect(handler.message).toEqual(['The Edge Firewall is in another deployment'])
  })

  it('appends the expected/got context from offending refs', () => {
    const handler = ErrorHandler.create(
      axiosError(409, {
        errors: [
          {
            detail: 'version mismatch',
            meta: { offending_refs: [{ expected: 'v3', got: 'v1' }] }
          }
        ]
      })
    )

    expect(handler.message).toEqual(['version mismatch (expected v3, got v1)'])
  })
})

describe('createMeta — the processError=false envelope', () => {
  it('returns the meta envelope when the first API error carries meta', () => {
    const raw = axiosError(423, { errors: [{ detail: 'locked', meta: { owner: 'ana' } }] })

    const envelope = ErrorHandler.createMeta(raw)

    expect(envelope.status).toBe(423)
    expect(envelope.data.hasError).toBe(true)
    expect(envelope.data.meta).toEqual({ owner: 'ana' })
    expect(envelope.data.error()).toBeInstanceOf(ErrorHandler)
  })

  it('returns null when there is no meta (caller must throw normally)', () => {
    expect(ErrorHandler.createMeta(axiosError(400, { errors: [{ detail: 'x' }] }))).toBeNull()
  })
})

describe('toast surface — one toast per message', () => {
  const twoErrors = () =>
    ErrorHandler.create(axiosError(400, { errors: [{ detail: 'one' }, { detail: 'two' }] }))

  it('showErrors emits each message as an error toast', () => {
    const toast = { add: vi.fn() }

    twoErrors().showErrors(toast)

    expect(toast.add).toHaveBeenCalledTimes(2)
    expect(toast.add.mock.calls[0][0]).toMatchObject({
      detail: 'one',
      summary: 'Error',
      severity: 'error',
      closable: true
    })
  })

  it('showWithOptions merges custom options over the defaults', () => {
    const toast = { add: vi.fn() }

    twoErrors().showWithOptions(toast, { summary: 'Deploy failed', life: 5000 })

    expect(toast.add.mock.calls[0][0]).toMatchObject({
      detail: 'one',
      summary: 'Deploy failed',
      severity: 'error',
      life: 5000
    })
  })

  it('showWithOptions accepts a per-message options callback', () => {
    const toast = { add: vi.fn() }

    twoErrors().showWithOptions(toast, (context) => ({ summary: `E:${context.message}` }))

    expect(toast.add.mock.calls[0][0].summary).toBe('E:one')
    expect(toast.add.mock.calls[1][0].summary).toBe('E:two')
  })

  it('showWithCallback hands each message to the callback with the handler context', () => {
    const seen = []

    twoErrors().showWithCallback((ctx) => seen.push(`${ctx.status}:${ctx.message}`))

    expect(seen).toEqual(['400:one', '400:two'])
  })
})
