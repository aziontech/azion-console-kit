import { describe, expect, it } from 'vitest'
import { ErrorHandler } from '@/services/v2/utils/errorHandler'

const jsonApiError = (errors, status = 400) => ({
  response: { status, data: { errors } }
})

describe('ErrorHandler with a JSON:API (vnd.api+json) payload', () => {
  it('keeps the request_id reachable — it is the only handle for support', () => {
    const handler = ErrorHandler.create(
      jsonApiError([
        {
          status: '401',
          code: '10002',
          title: 'Not Authenticated',
          detail: 'Authentication credentials were not provided',
          meta: { request_id: '21004a5f-0000-4000-8000-000000000001' }
        }
      ])
    )

    expect(handler.requestId).toBe('21004a5f-0000-4000-8000-000000000001')
    expect(handler.errors[0]).toMatchObject({
      status: '401',
      code: '10002',
      title: 'Not Authenticated',
      requestId: '21004a5f-0000-4000-8000-000000000001'
    })
  })

  it('reads the field from the /data/attributes/<field> pointer the v4 contract uses', () => {
    const handler = ErrorHandler.create(
      jsonApiError([
        { detail: 'is required', source: { pointer: '/data/attributes/plan_id' } },
        { detail: 'is invalid', source: { pointer: '/data/period' } }
      ])
    )

    expect(handler.message).toEqual(['Plan_id: is required', 'Period: is invalid'])
    expect(handler.errors.map((item) => item.field)).toEqual(['Plan_id', 'Period'])
  })

  it('exposes the raw pointer alongside the formatted field', () => {
    const handler = ErrorHandler.create(
      jsonApiError([{ detail: 'is required', source: { pointer: '/data/attributes/plan_id' } }])
    )

    expect(handler.errors[0].pointer).toBe('/data/attributes/plan_id')
  })

  it('falls back to the detail alone when there is no usable pointer', () => {
    const handler = ErrorHandler.create(
      jsonApiError([
        { detail: 'Subscription already exists', source: { pointer: '/data/attributes' } },
        { detail: 'Ambiguous context' }
      ])
    )

    expect(handler.message).toEqual(['Subscription already exists', 'Ambiguous context'])
  })

  it('carries the http status and stays quiet when the payload has no errors[]', () => {
    const handler = ErrorHandler.create({ response: { status: 500, data: {} } })

    expect(handler.status).toBe(500)
    expect(handler.requestId).toBeNull()
    expect(handler.errors).toEqual([])
  })

  it('reports a connection failure when there is no response at all', () => {
    const handler = ErrorHandler.create({ message: 'Network Error' })

    expect(handler.status).toBe(500)
    expect(handler.message).toEqual([ErrorHandler.ERROR_MESSAGES.CONNECTION_ERROR])
    expect(handler.requestId).toBeNull()
  })
})
