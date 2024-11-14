import { FILTERS_RULES } from '@/helpers'

/**
 * Check if the given field is relevant in the specified dataset.
 *
 * @param {string} fieldName - The name of the field to check.
 * @param {string} dataset - The dataset to check against.
 * @return {number} The index of the relevant field, or -1 if not relevant.
 */
export default function GetRelevantField(fieldName, dataset) {
  const fieldsRelevant = FILTERS_RULES.MOST_RELEVANT_FIELDS[dataset] || []
  return fieldsRelevant.indexOf(fieldName)
}
