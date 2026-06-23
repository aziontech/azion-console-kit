const formatNumber = (value, fraction = 1) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(fraction)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(fraction)}K`
  return value.toFixed(fraction)
}

const readSum = (rows) => Number(rows?.[0]?.sum ?? 0)
const readAvg = (rows) => Number(rows?.[0]?.avg ?? 0)
const readFieldSum = (rows, field) =>
  Array.isArray(rows) ? rows.reduce((total, row) => total + Number(row?.[field] ?? 0), 0) : 0

const buildVariation = (current, previous, type) => {
  if (!previous) return { value: 0, type }
  const value = ((current - previous) / previous) * 100
  return { value: Number(value.toFixed(2)), type }
}

const BYTES_IN_GB = 1_000_000_000

export class WorkloadMetricsAdapter {
  static transformOverviewMetrics(gqlData = {}) {
    const curRequests = readSum(gqlData.curRequests)
    const prevRequests = readSum(gqlData.prevRequests)

    const curBandwidth = readFieldSum(gqlData.curBandwidth, 'dataTransferredTotal')
    const prevBandwidth = readFieldSum(gqlData.prevBandwidth, 'dataTransferredTotal')

    const curLatency = readAvg(gqlData.curLatency)
    const prevLatency = readAvg(gqlData.prevLatency)

    const curErrors5xx = readSum(gqlData.curErrors5xx)
    const prevErrors5xx = readSum(gqlData.prevErrors5xx)

    const curErrorRate = curRequests ? (curErrors5xx / curRequests) * 100 : 0
    const prevErrorRate = prevRequests ? (prevErrors5xx / prevRequests) * 100 : 0

    return [
      {
        key: 'requests',
        label: 'Requests',
        value: formatNumber(curRequests, 1),
        unit: '',
        tooltip: 'Total HTTP requests served by this Workload.',
        variation: buildVariation(curRequests, prevRequests, 'regular'),
        isLoading: false
      },
      {
        key: 'bandwidth',
        label: 'Bandwidth',
        value: formatNumber(curBandwidth / BYTES_IN_GB, 0),
        unit: 'GB',
        tooltip: 'Total data transferred from the edge to clients.',
        variation: buildVariation(curBandwidth, prevBandwidth, 'regular'),
        isLoading: false
      },
      {
        key: 'latency',
        label: 'Avg Latency',
        value: Math.round(curLatency).toString(),
        unit: 'ms',
        tooltip: 'Average response time at the edge.',
        variation: buildVariation(curLatency, prevLatency, 'inverse'),
        isLoading: false
      },
      {
        key: 'errors',
        label: '5xx Errors',
        value: curErrorRate.toFixed(2),
        unit: '%',
        tooltip: 'Share of 5xx responses returned to clients.',
        variation: buildVariation(curErrorRate, prevErrorRate, 'inverse'),
        isLoading: false
      }
    ]
  }
}
