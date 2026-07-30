import { MAP_SERVICE_OPERATION } from '@/modules/real-time-metrics/constants'
import GetRelevantField from '@/modules/real-time-metrics/filters/relevant-fields'
import { FILTERS_RULES } from '@/helpers'

/**
 * Merges the parsed `datasetAvailable` (operators per field) and `infoAvailable`
 * (description/placeholder) into the final shape expected by `AdvancedFilterSystem`.
 *
 * Each returned item has:
 * ```
 * {
 *   label, value, mostRelevant,
 *   description,
 *   operator: [
 *     { value, type, props: { placeholder, services } },
 *     ...
 *   ]
 * }
 * ```
 *
 * The output is sorted by `FILTERS_RULES().sortFields` so most-relevant fields come first.
 *
 * @param {Array<Object>} datasetAvailable - Output of `parseDatasetAvailableFilters`.
 * @param {Object} infoAvailable - Output of `parseInfoAvailableFilters`.
 * @param {string} dataset - Dataset name (e.g. 'workloadEvents').
 * @return {Array<Object>} UI-ready filter fields list.
 */
export const buildFilterFields = (datasetAvailable, infoAvailable, dataset) => {
  if (!datasetAvailable?.length) return []

  const datasetInfo = infoAvailable?.[dataset] || {}

  const options = datasetAvailable.map(({ label, operator, value }) => {
    const info = datasetInfo[value]
    const mostRelevant = GetRelevantField(label, dataset)

    return {
      label,
      value,
      mostRelevant,
      description: info?.description,
      operator: operator.map((op) => ({
        value: op.value,
        type: op.type,
        props: {
          placeholder: info?.placeholder,
          services: MAP_SERVICE_OPERATION[`${value}${op.value}`] || []
        }
      }))
    }
  })

  FILTERS_RULES().sortFields(options)
  return options
}
