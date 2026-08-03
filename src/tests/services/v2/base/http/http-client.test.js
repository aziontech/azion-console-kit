// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { HttpClient, httpClient } from '@/services/v2/base/http/httpClient'

/**
 * HttpClient — the single door for ALL v2 API traffic (test-maturity fase 2:
 * the most critical untested module in the repo). axios is the real external
 * boundary, so mocking it here is the legitimate seam.
 */
vi.mock('axios', () => {
  const axiosFn = vi.fn(async (config) => ({ status: 200, data: { echo: config.url } }))
  axiosFn.defaults = { headers: { common: {} } }
  return { default: axiosFn }
})

beforeEach(() => {
  vi.clearAllMocks()
  axios.defaults.headers.common = {}
})

describe('HttpClient#send — request assembly', () => {
  it('passes method/url/data through and applies the safe defaults', async () => {
    await new HttpClient().send({ method: 'GET', url: 'v4/things' })

    expect(axios).toHaveBeenCalledTimes(1)
    const config = axios.mock.calls[0][0]
    expect(config).toMatchObject({
      method: 'GET',
      url: 'v4/things',
      baseURL: '/',
      withCredentials: true,
      headers: {}
    })
  })

  it('respects explicit baseURL, headers and withCredentials=false overrides', async () => {
    await new HttpClient().send({
      method: 'POST',
      url: 'login',
      baseURL: 'https://api.example.com',
      headers: { 'X-Trace': 'abc' },
      withCredentials: false
    })

    const config = axios.mock.calls[0][0]
    expect(config.baseURL).toBe('https://api.example.com')
    expect(config.withCredentials).toBe(false)
    expect(config.headers).toEqual({ 'X-Trace': 'abc' })
  })

  it('returns the axios response untouched', async () => {
    const response = await new HttpClient().send({ method: 'GET', url: 'v4/echo' })

    expect(response).toEqual({ status: 200, data: { echo: 'v4/echo' } })
  })
})

describe('HttpClient#send — global axios header contract', () => {
  it('defaults Accept and Content-Type to the v3 media type', async () => {
    await new HttpClient().send({ method: 'GET', url: 'v4/things' })

    expect(axios.defaults.headers.common['Accept']).toBe('application/json; version=3')
    expect(axios.defaults.headers.common['Content-Type']).toBe('application/json; version=3')
  })

  it('honors custom accept/contentType per request', async () => {
    await new HttpClient().send({
      method: 'GET',
      url: 'v4/things',
      accept: 'application/json; version=4',
      contentType: 'multipart/form-data'
    })

    expect(axios.defaults.headers.common['Accept']).toBe('application/json; version=4')
    expect(axios.defaults.headers.common['Content-Type']).toBe('multipart/form-data')
  })

  it('strips any global Authorization header on EVERY send (cookie-auth by design)', async () => {
    axios.defaults.headers.common['Authorization'] = 'Token leaked-from-somewhere'

    await new HttpClient().send({ method: 'GET', url: 'v4/things' })

    expect(axios.defaults.headers.common).not.toHaveProperty('Authorization')
  })
})

describe('singleton', () => {
  it('exports a ready HttpClient instance', () => {
    expect(httpClient).toBeInstanceOf(HttpClient)
  })
})
