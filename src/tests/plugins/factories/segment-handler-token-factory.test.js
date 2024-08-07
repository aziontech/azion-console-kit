import { describe, it, expect, vi } from 'vitest'
import { segmentHandlerToken } from '@/plugins/factories/segment-handler-token-factory'

describe('segmentHandlerToken', () => {
  it('should return the production token if environment is production', () => {
    const originalEnv = import.meta.env
    import.meta.env = { VITE_PROD_SEGMENT_TOKEN: 'prod_token_value' }

    const result = segmentHandlerToken('production')

    expect(result).toBe('prod_token_value')

    import.meta.env = originalEnv
  })

  it('should return the stage token if environment is not production', () => {
    const originalEnv = import.meta.env
    import.meta.env = { VITE_STAGE_SEGMENT_TOKEN: 'stage_token_value' }

    const result = segmentHandlerToken('development')

    expect(result).toBe('stage_token_value')

    import.meta.env = originalEnv
  })

  it('should warn and return an empty string if the token is missing', () => {
    const warnMock = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const originalEnv = import.meta.env
    import.meta.env = {}

    const result = segmentHandlerToken('production')

    expect(warnMock).toHaveBeenCalledWith('Segment token is missing')
    expect(result).toBe('')

    warnMock.mockRestore()
    import.meta.env = originalEnv
  })
})
