import { ref } from 'vue'
import { formatMetricValue } from '@/helpers/format-metric-value'
import {
  fetchHomeMetrics,
  fetchWafMetrics,
  fetchHomeMetricsVariationOnly,
  fetchWafMetricsVariationOnly
} from '@/services/home-metrics-service'
import { set, get } from '@/helpers/local-storage-manager'

const STORAGE_KEY = 'azion-home-metrics-filters'

const DEFAULT_FILTERS = {
  resource: 'workloads',
  timeRange: 'last-hour'
}

export const useHomeMetrics = () => {
  const storedFilters = get(STORAGE_KEY) || DEFAULT_FILTERS
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
          isLoading: true,
          isVariationLoading: true
        },
        {
          label: 'Total Requests Allowed',
          value: '0',
          unit: '',
          tooltip: 'Total number of requests allowed by WAF',
          isLoading: true,
          isVariationLoading: true
        },
        {
          label: 'Total Requests Threat',
          value: '0',
          unit: '',
          tooltip: 'Total number of threat requests detected by WAF',
          isLoading: true,
          isVariationLoading: true
        },
        {
          label: 'Top Country Threat',
          value: 'N/A',
          unit: '',
          tooltip: 'Country with the highest number of threat requests',
          isLoading: true,
          isVariationLoading: false
        }
      ]
    }

    return [
      {
        label: 'Total Data Transferred',
        value: '0',
        unit: 'Bytes',
        tooltip: 'Total amount of data transferred through the edge',
        isLoading: true,
        isVariationLoading: true
      },
      {
        label: 'Requests per Second',
        value: '0',
        unit: '/s',
        tooltip: 'Average number of requests per second',
        isLoading: true,
        isVariationLoading: true
      },
      {
        label: 'Bandwidth Saving',
        value: '0',
        unit: 'Bytes/s',
        tooltip: 'Bandwidth saved through caching and optimization',
        isLoading: true,
        isVariationLoading: true
      },
      {
        label: 'Data Transf. Offload',
        value: '0',
        unit: '%',
        tooltip: 'Percentage of data transfer offloaded to the edge',
        isLoading: true,
        isVariationLoading: true
      }
    ]
  }

  const updateMetricData = (index, value, unit, isVariationLoading = true) => {
    metricsData.value[index] = {
      ...metricsData.value[index],
      value,
      unit,
      isLoading: false,
      isVariationLoading
    }
  }

  const updateMetricVariation = (index, variation) => {
    metricsData.value[index] = {
      ...metricsData.value[index],
      variation,
      isVariationLoading: false
    }
  }

  const processWafMetrics = (metrics) => {
    const requestsBlockedFormatted = formatMetricValue(metrics.requestsBlocked, 'count')
    updateMetricData(0, requestsBlockedFormatted.value, requestsBlockedFormatted.unit, true)

    const requestsAllowedFormatted = formatMetricValue(metrics.requestsAllowed, 'count')
    updateMetricData(1, requestsAllowedFormatted.value, requestsAllowedFormatted.unit, true)

    const requestsThreatFormatted = formatMetricValue(metrics.requestsThreat, 'count')
    updateMetricData(2, requestsThreatFormatted.value, requestsThreatFormatted.unit, true)

    const topCountryFormatted = formatMetricValue(metrics.topCountryThreat.requests, 'count')
    updateMetricData(
      3,
      `${metrics.topCountryThreat.country} (${topCountryFormatted.value}${topCountryFormatted.unit})`,
      '',
      false
    )
  }

  const processWafVariations = (variations) => {
    updateMetricVariation(0, { value: variations.requestsBlockedVariation, type: 'inverse' })
    updateMetricVariation(1, { value: variations.requestsAllowedVariation, type: 'regular' })
    updateMetricVariation(2, { value: variations.requestsThreatVariation, type: 'inverse' })
  }

  const processWorkloadMetrics = (metrics) => {
    const dataTransferredFormatted = formatMetricValue(metrics.dataTransferred, 'bytes')
    updateMetricData(0, dataTransferredFormatted.value, dataTransferredFormatted.unit, true)

    const requestsFormatted = formatMetricValue(metrics.requests, 'count')
    updateMetricData(1, requestsFormatted.value, `${requestsFormatted.unit}/s`, true)

    const bandwidthSavedFormatted = formatMetricValue(metrics.bandwidthSaved, 'bytes')
    updateMetricData(2, bandwidthSavedFormatted.value, `${bandwidthSavedFormatted.unit}/s`, true)

    const offloadFormatted = formatMetricValue(metrics.offload, 'percentage')
    updateMetricData(3, offloadFormatted.value, offloadFormatted.unit, true)
  }

  const processWorkloadVariations = (variations) => {
    updateMetricVariation(0, { value: variations.dataTransferredVariation, type: 'regular' })
    updateMetricVariation(1, { value: variations.requestsVariation, type: 'regular' })
    updateMetricVariation(2, { value: variations.bandwidthSavedVariation, type: 'regular' })
    updateMetricVariation(3, { value: variations.offloadVariation, type: 'regular' })
  }

  const loadMetrics = async () => {
    isLoading.value = true
    metricsData.value = getDefaultMetricsConfig(selectedResource.value)

    try {
      const { begin, end } = getTimeRange()

      if (selectedResource.value === 'waf') {
        const metrics = await fetchWafMetrics(begin, end)
        processWafMetrics(metrics)
        isLoading.value = false

        fetchWafMetricsVariationOnly(metrics, begin, end)
          .then(processWafVariations)
          .catch(() => {
            metricsData.value.forEach((metric, index) => {
              if (index < 3) metric.isVariationLoading = false
            })
          })
      } else {
        const metrics = await fetchHomeMetrics(begin, end)
        processWorkloadMetrics(metrics)
        isLoading.value = false

        fetchHomeMetricsVariationOnly(metrics, begin, end)
          .then(processWorkloadVariations)
          .catch(() => {
            metricsData.value.forEach((metric) => {
              metric.isVariationLoading = false
            })
          })
      }
    } catch (error) {
      metricsData.value.forEach((metric) => {
        metric.isLoading = false
        metric.isVariationLoading = false
      })
      isLoading.value = false
    }
  }

  const updateFilters = async () => {
    set({
      key: STORAGE_KEY,
      value: {
        resource: selectedResource.value,
        timeRange: selectedTimeRange.value
      }
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
