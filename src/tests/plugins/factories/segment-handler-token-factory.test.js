import { describe, it, expect, vi, afterEach } from 'vitest'
import { makeSegmentToken } from '@/plugins/factories/segment-handler-token-factory'
import { getRuntimeConfig } from '@/helpers/runtime-config'

vi.mock('@/helpers/runtime-config', () => ({
  getRuntimeConfig: vi.fn(() => ({}))
}))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  getRuntimeConfig.mockReset()
  getRuntimeConfig.mockReturnValue({})
})

describe('makeSegmentToken', () => {
  it('should return the production token if environment is production', () => {
    vi.stubEnv('VITE_SEGMENT_TOKEN', 'prod_token_value')
    const result = makeSegmentToken()

    expect(result).toBe('prod_token_value')
  })

  it('should return the stage token if environment is not production', () => {
    vi.stubEnv('VITE_SEGMENT_TOKEN', 'stage_token_value')

    const result = makeSegmentToken()

    expect(result).toBe('stage_token_value')
  })

  it('should prefer the runtime config token over the build-time env', () => {
    getRuntimeConfig.mockReturnValue({ segmentToken: 'runtime_token' })
    vi.stubEnv('VITE_SEGMENT_TOKEN', 'build_time_token')

    expect(makeSegmentToken()).toBe('runtime_token')
  })

  it('should fall back to the build-time env when the runtime config is empty', () => {
    getRuntimeConfig.mockReturnValue({})
    vi.stubEnv('VITE_SEGMENT_TOKEN', 'build_time_token')

    expect(makeSegmentToken()).toBe('build_time_token')
  })

  it('should warn and return an empty string if the token is missing', () => {
    const warnMock = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubEnv('VITE_SEGMENT_TOKEN', '')

    const result = makeSegmentToken()

    expect(warnMock).toHaveBeenCalledWith('Segment token is missing')
    expect(result).toBeUndefined()

    warnMock.mockRestore()
  })
})
