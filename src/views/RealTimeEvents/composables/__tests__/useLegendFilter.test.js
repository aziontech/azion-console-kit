import { describe, it, expect, vi } from 'vitest'
import { useLegendFilter } from '../useLegendFilter'

describe('useLegendFilter', () => {
  const setup = () => {
    const handleAddFilter = vi.fn()
    const handleAddRangeFilter = vi.fn()
    const { handleLegendFilter } = useLegendFilter({ handleAddFilter, handleAddRangeFilter })
    return { handleLegendFilter, handleAddFilter, handleAddRangeFilter }
  }

  it('does nothing when bucket is falsy', () => {
    const { handleLegendFilter, handleAddFilter, handleAddRangeFilter } = setup()
    handleLegendFilter({ bucket: '', stackBy: 'status' })
    handleLegendFilter({ bucket: null, stackBy: 'status' })
    handleLegendFilter({ bucket: undefined, stackBy: 'status' })
    expect(handleAddFilter).not.toHaveBeenCalled()
    expect(handleAddRangeFilter).not.toHaveBeenCalled()
  })

  describe('Events histogram — status stacking', () => {
    it.each([
      ['2xx', 200, 300],
      ['3xx', 300, 400],
      ['4xx', 400, 500],
      ['5xx', 500, 600]
    ])('adds range filter for known bucket %s', (bucket, min, max) => {
      const { handleLegendFilter, handleAddRangeFilter } = setup()
      handleLegendFilter({ bucket, stackBy: 'status' })
      expect(handleAddRangeFilter).toHaveBeenCalledWith('status', min, max)
    })

    it('falls back to equality filter for unknown status bucket', () => {
      const { handleLegendFilter, handleAddFilter, handleAddRangeFilter } = setup()
      handleLegendFilter({ bucket: '1xx', stackBy: 'status' })
      expect(handleAddRangeFilter).not.toHaveBeenCalled()
      expect(handleAddFilter).toHaveBeenCalledWith('status', '1xx')
    })
  })

  describe('Events histogram — requestMethod stacking', () => {
    it('adds equality filter for requestMethod', () => {
      const { handleLegendFilter, handleAddFilter } = setup()
      handleLegendFilter({ bucket: 'GET', stackBy: 'requestMethod' })
      expect(handleAddFilter).toHaveBeenCalledWith('requestMethod', 'GET')
    })
  })

  describe('Metrics chart — pivot mapping', () => {
    it('adds filter using pivot field for pivot-based mappings', () => {
      const { handleLegendFilter, handleAddFilter } = setup()
      handleLegendFilter({ bucket: 'myhost.com', stackBy: undefined, metricsKey: 'wafThreatsByHost' })
      expect(handleAddFilter).toHaveBeenCalledWith('host', 'myhost.com')
    })

    it('handles botTraffic pivot mapping', () => {
      const { handleLegendFilter, handleAddFilter } = setup()
      handleLegendFilter({ bucket: 'good_bot', stackBy: undefined, metricsKey: 'botTraffic' })
      expect(handleAddFilter).toHaveBeenCalledWith('classified', 'good_bot')
    })
  })

  describe('Metrics chart — object mapping', () => {
    it('adds multiple filters for wafThreats series', () => {
      const { handleLegendFilter, handleAddFilter } = setup()
      handleLegendFilter({ bucket: 'wafRequestsAllowed', stackBy: undefined, metricsKey: 'wafThreats' })
      expect(handleAddFilter).toHaveBeenCalledTimes(2)
      expect(handleAddFilter).toHaveBeenCalledWith('wafBlock', '0')
      expect(handleAddFilter).toHaveBeenCalledWith('wafLearning', '0')
    })

    it('adds single filter for wafXss series', () => {
      const { handleLegendFilter, handleAddFilter } = setup()
      handleLegendFilter({ bucket: 'wafRequestsXssAttacks', stackBy: undefined, metricsKey: 'wafXss' })
      expect(handleAddFilter).toHaveBeenCalledWith('wafAttackFamily', '$XSS')
    })
  })

  describe('edge cases', () => {
    it('does nothing when metricsKey is missing and stackBy is not status/requestMethod', () => {
      const { handleLegendFilter, handleAddFilter, handleAddRangeFilter } = setup()
      handleLegendFilter({ bucket: 'something', stackBy: undefined, metricsKey: undefined })
      expect(handleAddFilter).not.toHaveBeenCalled()
      expect(handleAddRangeFilter).not.toHaveBeenCalled()
    })

    it('does nothing when metricsKey has no mapping', () => {
      const { handleLegendFilter, handleAddFilter, handleAddRangeFilter } = setup()
      handleLegendFilter({ bucket: 'something', stackBy: undefined, metricsKey: 'nonExistentKey' })
      expect(handleAddFilter).not.toHaveBeenCalled()
      expect(handleAddRangeFilter).not.toHaveBeenCalled()
    })

    it('does nothing when bucket does not match any series in object mapping', () => {
      const { handleLegendFilter, handleAddFilter } = setup()
      handleLegendFilter({ bucket: 'unknownSeries', stackBy: undefined, metricsKey: 'wafThreats' })
      expect(handleAddFilter).not.toHaveBeenCalled()
    })
  })
})
