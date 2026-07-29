import safeStructuredClone from '@/helpers/structured-clone'

/**
 * Builds the Share_State projections for the RTE tab panel.
 * `getCurrentShareState` is the whole projection (share links / defineExpose);
 * `getFetchInputsSnapshot` drops the CLIENT-ONLY documentQuery/selectedFields
 * so the keep-alive `activate` guard only refetches on fetch-affecting changes.
 *
 * @param {Object} deps
 * @param {import('vue').Ref} deps.filterData
 * @param {import('vue').Ref} deps.pageSize
 * @param {import('vue').Ref} deps.selectedFields
 * @param {import('vue').Ref} deps.documentSearchQuery
 * @param {import('vue').Ref} deps.selectedView
 * @param {() => (string|null)} deps.dataset - current dataset panel key
 * @returns {{ getCurrentShareState: Function, getFetchInputsSnapshot: Function }}
 */
export function useShareState({
  filterData,
  pageSize,
  selectedFields,
  documentSearchQuery,
  selectedView,
  dataset
}) {
  const getCurrentShareState = () => ({
    filters: filterData.value ? safeStructuredClone(filterData.value) : null,
    dataset: dataset() || null,
    pageSize: pageSize.value,
    selectedFields: [...selectedFields.value],
    documentQuery: documentSearchQuery.value || '',
    selectedView: selectedView.value || 'events:none'
  })

  // Comparison-only projection (C7): the caller stringifies it deterministically
  // for the activate guard, so no safeStructuredClone is needed — reference the
  // live filterData directly. getCurrentShareState (share links) keeps its clone.
  const getFetchInputsSnapshot = () => ({
    filters: filterData.value || null,
    dataset: dataset() || null,
    pageSize: pageSize.value,
    selectedView: selectedView.value || 'events:none'
  })

  return { getCurrentShareState, getFetchInputsSnapshot }
}
