import { describe, expect, it } from 'vitest'
import { formatDataUnit } from '@modules/real-time-metrics/chart/format-graph'

describe('formatDataUnit', () => {
  it('should format byte values with decimal SI prefixes', () => {
    const chartData = { dataUnit: 'bytes' }

    expect(formatDataUnit(1_000, chartData)).toEqual({ value: '1.0', unit: 'KB' })
    expect(formatDataUnit(1_000_000, chartData)).toEqual({ value: '1.0', unit: 'MB' })
    expect(formatDataUnit(1_500_000_000, chartData)).toEqual({ value: '1.5', unit: 'GB' })
  })
})
