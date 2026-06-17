import { describe, expect, it } from 'vitest'
import { formatMetricValue } from '@/helpers/format-metric-value'

describe('formatMetricValue', () => {
  it('should format byte values with decimal SI prefixes', () => {
    expect(formatMetricValue(1_500_000, 'bytes')).toEqual({ value: '1.5', unit: 'MB' })
    expect(formatMetricValue(1_500_000_000, 'bytes')).toEqual({ value: '1.5', unit: 'GB' })
  })
})
