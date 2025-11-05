import { ref, computed } from 'vue'

export function useTableQuery(options = {}) {
  const {
    useQueryFn,
    listService,
    apiFields = [],
    defaultOrderingFieldName = 'id',
    itemsByPage: initialItemsByPage = 10,
    isGraphql = false,
    lazy = true,
    toast
  } = options

  if (!listService && !useQueryFn) {
    throw new Error('Either listService or useQueryFn must be provided')
  }

  const itemsByPage = ref(initialItemsByPage)
  const savedSearch = ref('')
  const savedOrdering = ref(defaultOrderingFieldName)
  const firstLoadData = ref(true)

  const isUsingQuery = computed(() => !!useQueryFn)

  const queryParams = ref({
    page: 1,
    pageSize: itemsByPage.value,
    fields: apiFields,
    ordering: defaultOrderingFieldName
  })

  const queryResult = isUsingQuery.value ? useQueryFn(queryParams) : null

  const serviceIsLoading = ref(false)
  const serviceData = ref([])
  const serviceTotalRecords = ref(0)

  const isLoading = computed(() => {
    if (isUsingQuery.value && queryResult) {
      return queryResult.isPending?.value ?? queryResult.isLoading?.value ?? false
    }
    return serviceIsLoading.value
  })

  const data = computed(() => {
    if (isUsingQuery.value && queryResult?.data?.value) {
      return queryResult.data.value.body || []
    }
    return serviceData.value
  })

  const totalRecords = computed(() => {
    if (isUsingQuery.value && queryResult?.data?.value) {
      return queryResult.data.value.count || 0
    }
    return serviceTotalRecords.value
  })

  const error = computed(() => {
    if (isUsingQuery.value && queryResult?.error?.value) {
      return queryResult.error.value
    }
    return null
  })

  const loadData = async (params, customService = null) => {
    if (isUsingQuery.value) {
      queryParams.value = {
        ...params,
        pageSize: itemsByPage.value,
        fields: apiFields
      }
      return
    }

    try {
      serviceIsLoading.value = true
      const service = customService || listService

      const { count = 0, body = [] } = isGraphql ? await service() : await service(params)

      serviceData.value = body
      serviceTotalRecords.value = count
    } catch (error) {
      handleError(error)
    } finally {
      serviceIsLoading.value = false
      if (firstLoadData.value) {
        firstLoadData.value = false
      }
    }
  }

  const handleError = (error) => {
    if (!toast) return

    if (error && typeof error.showErrors === 'function') {
      error.showErrors(toast)
    } else {
      const errorMessage = error.message || error
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error',
        detail: errorMessage
      })
    }
  }

  const reload = async (additionalParams = {}, customService = null) => {
    if (!savedOrdering.value) {
      savedOrdering.value = defaultOrderingFieldName
    }

    const commonParams = {
      page: 1,
      pageSize: itemsByPage.value,
      fields: apiFields,
      ordering: savedOrdering.value,
      ...additionalParams
    }

    if (lazy) {
      commonParams.search = savedSearch.value
    }

    if (isUsingQuery.value) {
      queryParams.value = { ...commonParams }
    } else {
      await loadData(commonParams, customService)
    }
  }

  const updateSort = async (sortEvent) => {
    const { sortField, sortOrder } = sortEvent
    let ordering = sortOrder === -1 ? `-${sortField}` : sortField
    ordering = ordering === null ? defaultOrderingFieldName : ordering

    savedOrdering.value = ordering
    await reload({ ordering })
  }

  const updatePagination = async (page, pageSize) => {
    itemsByPage.value = pageSize

    const params = {
      page,
      pageSize,
      fields: apiFields,
      ordering: savedOrdering.value || defaultOrderingFieldName
    }

    if (lazy && savedSearch.value) {
      params.search = savedSearch.value
    }

    if (isUsingQuery.value) {
      queryParams.value = { ...params }
    } else {
      await loadData(params)
    }
  }

  /**
   * Atualiza a busca
   * @param {String} searchValue - Valor da busca
   */
  const updateSearch = async (searchValue) => {
    savedSearch.value = searchValue

    const params = {
      page: 1,
      pageSize: itemsByPage.value,
      fields: apiFields,
      ordering: savedOrdering.value || defaultOrderingFieldName,
      search: searchValue
    }

    if (isUsingQuery.value) {
      queryParams.value = { ...params }
    } else {
      await loadData(params)
    }
  }

  return {
    isLoading,
    data,
    totalRecords,
    itemsByPage,
    savedSearch,
    savedOrdering,
    firstLoadData,
    isUsingQuery,
    error,

    queryParams,
    queryResult,

    loadData,
    reload,
    updateSort,
    updatePagination,
    updateSearch,
    handleError
  }
}
