import { describe, expect, it } from 'vitest'
import { WorkloadMetricsAdapter } from '@/services/v2/workload/workload-metrics-adapter'

const byKey = (cards, key) => cards.find((card) => card.key === key)

describe('WorkloadMetricsAdapter.transformOverviewMetrics', () => {
  it('builds the four KPI cards with formatted values and real variation when there is traffic', () => {
    const cards = WorkloadMetricsAdapter.transformOverviewMetrics({
      curRequests: [{ sum: 12_000_000 }],
      prevRequests: [{ sum: 10_000_000 }],
      curBandwidth: [{ dataTransferredTotal: 500_000_000_000 }],
      prevBandwidth: [{ dataTransferredTotal: 400_000_000_000 }],
      curLatency: [{ avg: 42.6 }],
      prevLatency: [{ avg: 40 }],
      curErrors5xx: [{ sum: 120_000 }],
      prevErrors5xx: [{ sum: 100_000 }]
    })

    expect(cards).toHaveLength(4)
    expect(cards.map((card) => card.key)).toEqual(['requests', 'bandwidth', 'latency', 'errors'])

    expect(byKey(cards, 'requests')).toMatchObject({
      value: '12.0M',
      unit: '',
      variation: { value: 20, type: 'regular' }
    })
    expect(byKey(cards, 'bandwidth')).toMatchObject({
      value: '500',
      unit: 'GB',
      variation: { value: 25, type: 'regular' }
    })
    expect(byKey(cards, 'latency')).toMatchObject({
      label: 'Avg Latency',
      value: '43',
      unit: 'ms',
      variation: { value: 6.5, type: 'inverse' }
    })
    expect(byKey(cards, 'errors')).toMatchObject({
      value: '1.00',
      unit: '%',
      variation: { value: 0, type: 'inverse' }
    })
  })

  it('computes the 5xx error rate as a share of total requests', () => {
    const cards = WorkloadMetricsAdapter.transformOverviewMetrics({
      curRequests: [{ sum: 200 }],
      prevRequests: [{ sum: 100 }],
      curErrors5xx: [{ sum: 10 }],
      prevErrors5xx: [{ sum: 2 }]
    })

    expect(byKey(cards, 'errors')).toMatchObject({
      value: '5.00',
      variation: { value: 150, type: 'inverse' }
    })
  })

  it('sums bandwidth (dataTransferredTotal) across all returned rows', () => {
    const cards = WorkloadMetricsAdapter.transformOverviewMetrics({
      curBandwidth: [
        { dataTransferredTotal: 300_000_000_000 },
        { dataTransferredTotal: 200_000_000_000 }
      ]
    })

    expect(byKey(cards, 'bandwidth')).toMatchObject({ value: '500', unit: 'GB' })
  })

  it('returns zeroed cards and no variation when there is no traffic', () => {
    const cards = WorkloadMetricsAdapter.transformOverviewMetrics({})

    expect(byKey(cards, 'requests')).toMatchObject({
      value: '0.0',
      variation: { value: 0, type: 'regular' }
    })
    expect(byKey(cards, 'bandwidth').value).toBe('0')
    expect(byKey(cards, 'latency').value).toBe('0')
    expect(byKey(cards, 'errors').value).toBe('0.00')
  })

  it('hides variation (value 0) when the previous period has no data', () => {
    const cards = WorkloadMetricsAdapter.transformOverviewMetrics({
      curRequests: [{ sum: 5000 }],
      prevRequests: [{ sum: 0 }],
      curLatency: [{ avg: 30 }],
      prevLatency: []
    })

    expect(byKey(cards, 'requests').variation).toEqual({ value: 0, type: 'regular' })
    expect(byKey(cards, 'latency').variation).toEqual({ value: 0, type: 'inverse' })
  })

  it('defaults gracefully when called with no argument', () => {
    const cards = WorkloadMetricsAdapter.transformOverviewMetrics()

    expect(cards).toHaveLength(4)
    expect(byKey(cards, 'requests').value).toBe('0.0')
  })
})
