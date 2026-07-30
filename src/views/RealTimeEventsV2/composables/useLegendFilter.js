import { STATUS_BUCKET_RANGES, METRICS_LEGEND_FILTERS } from '../Blocks/constants/legend-filters'

/**
 * Encapsulates chart legend click → filter dispatch logic.
 *
 * @param {Object} deps
 * @param {Function} deps.handleAddFilter  - (field, value) → adds an equality filter
 * @param {Function} deps.handleAddRangeFilter - (field, min, max) → adds a range filter
 * @returns {{ handleLegendFilter: Function }}
 */
export function useLegendFilter({ handleAddFilter, handleAddRangeFilter }) {
  const handleLegendFilter = ({ bucket, stackBy, metricsKey }) => {
    if (!bucket) return

    // Events histogram: legacy status / requestMethod stacking.
    if (stackBy === 'status') {
      const range = STATUS_BUCKET_RANGES[bucket]
      if (range) handleAddRangeFilter('status', range[0], range[1])
      else handleAddFilter('status', bucket)
      return
    }

    if (stackBy === 'requestMethod') {
      handleAddFilter('requestMethod', bucket)
      return
    }

    // Metrics chart: look up the series → filter mapping.
    if (!metricsKey) return
    const mapping = METRICS_LEGEND_FILTERS[metricsKey]
    if (!mapping) return

    if (typeof mapping === 'string' && mapping.startsWith('pivot-')) {
      handleAddFilter(mapping.slice('pivot-'.length), bucket)
      return
    }

    const pairs = mapping[bucket]
    if (!Array.isArray(pairs)) return
    pairs.forEach(({ field, value }) => handleAddFilter(field, value))
  }

  return { handleLegendFilter }
}
