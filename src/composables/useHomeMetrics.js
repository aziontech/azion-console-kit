import { ref } from 'vue'
import { formatMetricValue } from '@/helpers/format-metric-value'
import {
  fetchHomeMetricsWithVariation,
  fetchWafMetricsWithVariation
} from '@/services/home-metrics-service'

const STORAGE_KEY = 'azion-home-metrics-filters'

const DEFAULT_FILTERS = {
  resource: 'workloads',
  timeRange: 'last-hour'
}

const getStoredFilters = () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    return JSON.parse(stored)
  }
  return DEFAULT_FILTERS
}

const saveFiltersToStorage = (filters) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
}

export const useHomeMetrics = () => {
  const storedFilters = getStoredFilters()
  const selectedResource = ref(storedFilters.resource)
  const selectedTimeRange = ref(storedFilters.timeRange)
  const isLoading = ref(false)
  const metricsData = ref([])

  const timeRangeOptions = [
    { label: 'Last Hour', value: 'last-hour', hours: 1 },
    { label: 'Last Day', value: 'last-day', hours: 24 },
    { label: 'Last Week', value: 'last-week', hours: 168 }
  ]

  const getTimeRange = () => {
    const selectedOption = timeRangeOptions.find((opt) => opt.value === selectedTimeRange.value)
    const hours = selectedOption?.hours || 1

    const now = new Date()
    const end = now.toISOString().slice(0, 19)
    const begin = new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString().slice(0, 19)

    return { begin, end }
  }

  const getDefaultMetricsConfig = (resourceType) => {
    if (resourceType === 'waf') {
      return [
        {
          label: 'Total Requests Blocked',
          value: '0',
          unit: '',
          tooltip: 'Total number of requests blocked by WAF',
          isLoading: true
        },
        {
          label: 'Total Requests Allowed',
          value: '0',
          unit: '',
          tooltip: 'Total number of requests allowed by WAF',
          isLoading: true
        },
        {
          label: 'Total Requests Threat',
          value: '0',
          unit: '',
          tooltip: 'Total number of threat requests detected by WAF',
          isLoading: true
        },
        {
          label: 'Top Country Threat',
          value: 'N/A',
          unit: '',
          tooltip: 'Country with the highest number of threat requests',
          isLoading: true
        }
      ]
    }

    return [
      {
        label: 'Total Data Transferred',
        value: '0',
        unit: 'Bytes',
        tooltip: 'Total amount of data transferred through the edge',
        isLoading: true
      },
      {
        label: 'Requests per Second',
        value: '0',
        unit: '/s',
        tooltip: 'Average number of requests per second',
        isLoading: true
      },
      {
        label: 'Bandwidth Saving',
        value: '0',
        unit: 'Bytes',
        tooltip: 'Bandwidth saved through caching and optimization',
        isLoading: true
      },
      {
        label: 'Data Transf. Offload',
        value: '0',
        unit: '%',
        tooltip: 'Percentage of data transfer offloaded to the edge',
        isLoading: true
      }
    ]
  }

  const updateMetricData = (index, value, unit, variation = null) => {
    metricsData.value[index] = {
      ...metricsData.value[index],
      value,
      unit,
      variation,
      isLoading: false
    }
  }

  const processWafMetrics = (metrics) => {
    const requestsBlockedFormatted = formatMetricValue(metrics.requestsBlocked, 'count')
    updateMetricData(0, requestsBlockedFormatted.value, requestsBlockedFormatted.unit, {
      value: metrics.requestsBlockedVariation,
      type: 'inverse'
    })

    const requestsAllowedFormatted = formatMetricValue(metrics.requestsAllowed, 'count')
    updateMetricData(1, requestsAllowedFormatted.value, requestsAllowedFormatted.unit, {
      value: metrics.requestsAllowedVariation,
      type: 'regular'
    })

    const requestsThreatFormatted = formatMetricValue(metrics.requestsThreat, 'count')
    updateMetricData(2, requestsThreatFormatted.value, requestsThreatFormatted.unit, {
      value: metrics.requestsThreatVariation,
      type: 'inverse'
    })

    const topCountryFormatted = formatMetricValue(metrics.topCountryThreat.requests, 'count')
    updateMetricData(
      3,
      `${metrics.topCountryThreat.country} (${topCountryFormatted.value}${topCountryFormatted.unit})`,
      ''
    )
  }

  const processWorkloadMetrics = (metrics) => {
    const dataTransferredFormatted = formatMetricValue(metrics.dataTransferred, 'bytes')
    updateMetricData(0, dataTransferredFormatted.value, dataTransferredFormatted.unit, {
      value: metrics.dataTransferredVariation,
      type: 'regular'
    })

    const requestsFormatted = formatMetricValue(metrics.requests, 'count')
    updateMetricData(1, requestsFormatted.value, `${requestsFormatted.unit}/s`, {
      value: metrics.requestsVariation,
      type: 'regular'
    })

    const bandwidthSavedFormatted = formatMetricValue(metrics.bandwidthSaved, 'bytes')
    updateMetricData(2, bandwidthSavedFormatted.value, bandwidthSavedFormatted.unit, {
      value: metrics.bandwidthSavedVariation,
      type: 'regular'
    })

    const offloadFormatted = formatMetricValue(metrics.offload, 'percentage')
    updateMetricData(3, offloadFormatted.value, offloadFormatted.unit, {
      value: metrics.offloadVariation,
      type: 'regular'
    })
  }

  const loadMetrics = async () => {
    isLoading.value = true
    metricsData.value = getDefaultMetricsConfig(selectedResource.value)

    try {
      const { begin, end } = getTimeRange()

      if (selectedResource.value === 'waf') {
        const metrics = await fetchWafMetricsWithVariation(begin, end)
        processWafMetrics(metrics)
      } else {
        const metrics = await fetchHomeMetricsWithVariation(begin, end)
        processWorkloadMetrics(metrics)
      }
    } catch (error) {
      metricsData.value.forEach((metric) => {
        metric.isLoading = false
      })
    } finally {
      isLoading.value = false
    }
  }

  const updateFilters = async () => {
    saveFiltersToStorage({
      resource: selectedResource.value,
      timeRange: selectedTimeRange.value
    })
    metricsData.value = getDefaultMetricsConfig(selectedResource.value)
    await loadMetrics()
  }

  return {
    selectedResource,
    selectedTimeRange,
    isLoading,
    metricsData,
    timeRangeOptions,
    loadMetrics,
    updateFilters
  }
}
