import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const importFreshModule = async () => {
  vi.resetModules()
  return import('@/helpers/runtime-config')
}

describe('runtime-config', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should resolve and cache the config served at /config.json', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ environment: 'stage', segmentToken: 'seg-token' })
    })
    vi.stubGlobal('fetch', fetchMock)
    const { loadRuntimeConfig, getRuntimeConfig } = await importFreshModule()

    const config = await loadRuntimeConfig()

    expect(fetchMock).toHaveBeenCalledWith('/config.json')
    expect(config).toEqual({ environment: 'stage', segmentToken: 'seg-token' })
    expect(getRuntimeConfig()).toEqual({ environment: 'stage', segmentToken: 'seg-token' })
  })

  it('should fetch only once across multiple loads (cached)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ environment: 'production' })
    })
    vi.stubGlobal('fetch', fetchMock)
    const { loadRuntimeConfig } = await importFreshModule()

    await loadRuntimeConfig()
    const second = await loadRuntimeConfig()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(second).toEqual({ environment: 'production' })
  })

  it('should fall back to an empty config when /config.json is absent (404)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    const { loadRuntimeConfig, getRuntimeConfig } = await importFreshModule()

    const config = await loadRuntimeConfig()

    expect(config).toEqual({})
    expect(getRuntimeConfig()).toEqual({})
  })

  it('should fall back to an empty config when the fetch itself fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const { loadRuntimeConfig } = await importFreshModule()

    await expect(loadRuntimeConfig()).resolves.toEqual({})
  })

  it('should return an empty object from getRuntimeConfig before load resolves', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const { getRuntimeConfig } = await importFreshModule()

    expect(getRuntimeConfig()).toEqual({})
  })
})
