// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest'
import { HttpService } from '@/services/v2/base/http/httpService'
import { ErrorHandler } from '@/services/v2/utils/errorHandler'

/**
 * HttpService — the orchestrator every v2 service calls (test-maturity, deep
 * pass): URL/param assembly, abort wiring and the error contract. The unit
 * seam is its own HttpClient instance (axios itself is covered by
 * http-client.test.js).
 */
afterEach(() => {
  vi.restoreAllMocks()
})

const serviceWithSendSpy = (impl = async () => ({ status: 200, data: {} })) => {
  const service = new HttpService()
  const send = vi.spyOn(service.httpClient, 'send').mockImplementation(impl)
  return { service, send }
}

const axios404 = (payload) => {
  const error = new Error('Request failed with status code 404')
  error.response = { status: 404, data: payload }
  return error
}

describe('request assembly', () => {
  it('serializes params into the URL as snake_case query string', async () => {
    const { service, send } = serviceWithSendSpy()

    await service.request({
      method: 'GET',
      url: 'v4/things',
      params: { pageSize: 10, search: 'x' }
    })

    expect(send.mock.calls[0][0].url).toBe('v4/things?page_size=10&search=x')
  })

  it('leaves the URL untouched when there are no params', async () => {
    const { service, send } = serviceWithSendSpy()

    await service.request({ method: 'GET', url: 'v4/things' })

    expect(send.mock.calls[0][0].url).toBe('v4/things')
  })

  it('passes body and extra config through to the client', async () => {
    const { service, send } = serviceWithSendSpy()

    await service.request({
      method: 'POST',
      url: 'v4/things',
      body: { name: 'x' },
      config: { baseURL: '/api' }
    })

    expect(send.mock.calls[0][0]).toMatchObject({
      method: 'POST',
      data: { name: 'x' },
      baseURL: '/api'
    })
  })
})

describe('abort wiring', () => {
  it('attaches a signal when abortIdentifier is given and abort() cancels it', async () => {
    const { service, send } = serviceWithSendSpy()

    await service.request({ method: 'GET', url: 'v4/slow', abortIdentifier: 'slow-1' })

    const { signal } = send.mock.calls[0][0]
    expect(signal).toBeInstanceOf(AbortSignal)
    expect(signal.aborted).toBe(false)

    service.abort('slow-1')
    expect(signal.aborted).toBe(true)
  })

  it('abortGroup cancels every request registered under the group', async () => {
    const { service, send } = serviceWithSendSpy()

    await service.request({ method: 'GET', url: 'a', abortIdentifier: 'a', abortGroup: 'list' })
    await service.request({ method: 'GET', url: 'b', abortIdentifier: 'b', abortGroup: 'list' })

    service.abortGroup('list')

    expect(send.mock.calls[0][0].signal.aborted).toBe(true)
    expect(send.mock.calls[1][0].signal.aborted).toBe(true)
  })

  it('an explicit config.signal wins over the abort manager', async () => {
    const { service, send } = serviceWithSendSpy()
    const external = new AbortController()

    await service.request({
      method: 'GET',
      url: 'v4/x',
      abortIdentifier: 'ignored',
      config: { signal: external.signal }
    })

    expect(send.mock.calls[0][0].signal).toBe(external.signal)
  })
})

describe('error contract (what every v2 service actually receives)', () => {
  it('wraps axios failures into an ErrorHandler with status and parsed messages', async () => {
    const { service } = serviceWithSendSpy(async () => {
      throw axios404({ errors: [{ detail: 'Thing not found' }] })
    })

    const failure = await service
      .request({ method: 'GET', url: 'v4/things/9' })
      .catch((error) => error)

    expect(failure).toBeInstanceOf(ErrorHandler)
    expect(failure.status).toBe(404)
    expect(failure.message).toEqual(['Thing not found'])
  })

  it('processError=false returns the meta envelope instead of throwing (when meta exists)', async () => {
    const { service } = serviceWithSendSpy(async () => {
      throw axios404({ errors: [{ detail: 'locked', meta: { locked_by: 'other-user' } }] })
    })

    const result = await service.request({ method: 'GET', url: 'v4/locked', processError: false })

    expect(result.status).toBe(404)
    expect(result.data.hasError).toBe(true)
    expect(result.data.meta).toEqual({ locked_by: 'other-user' })
    expect(result.data.error()).toBeInstanceOf(ErrorHandler)
  })

  it('processError=false still THROWS when the error carries no meta', async () => {
    const { service } = serviceWithSendSpy(async () => {
      throw axios404({ errors: [{ detail: 'plain failure' }] })
    })

    await expect(
      service.request({ method: 'GET', url: 'v4/x', processError: false })
    ).rejects.toBeInstanceOf(ErrorHandler)
  })
})
