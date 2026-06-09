<template>
  <BannerContentBlock>
    <template #heading>
      <div class="border-b surface-border surface-ground">
        <div
          class="px-3 py-4 sm:px-8 sm:py-8 gap-4 flex lg:px-8 lg:py-16 flex-col max-w-screen-2xl-test mx-auto w-full"
        >
          <div class="text-2xl sm:text-3xl font-medium">
            Accelerate your workflow with Azion Marketplace
          </div>
          <div class="text-sm sm:text-xl text-color-secondary">
            Take advantage of templates, libraries, and integrations to build and compose modern
            workloads.
          </div>
        </div>
      </div>
    </template>
    <template #content>
      <div class="w-full flex flex-col md:flex-row gap-6 lg:gap-8">
        <!-- Sidebar -->
        <div
          class="flex flex-col md:flex-shrink-0 gap-8 px-3 pt-8 pb-0 md:px-8 w-full md:pr-0 md:w-80 md:sticky md:top-14 self-start"
        >
          <!-- Search -->
          <div class="flex flex-col w-full gap-3">
            <label
              for="search"
              class="text-color text-base font-medium"
              >Search on Marketplace</label
            >
            <span class="p-input-icon-left">
              <i class="pi pi-search" />
              <InputText
                class="w-full"
                type="text"
                placeholder="Search"
                @input="searchSolutions"
                v-model="search"
              />
            </span>
          </div>
          <!-- Filters -->
          <div class="flex flex-col gap-3">
            <label class="text-color text-base font-medium">Categories</label>
            <div class="card flex justify-content-center">
              <Listbox
                v-model="selectedCategory"
                :options="categoriesList"
                @change="changeCategory"
                option-label="name"
                :optionDisabled="disabledOption"
                class="w-full md:w-14rem border-none surface-ground sm:min-w-[12rem]"
                :pt="{
                  list: { class: 'p-0' }
                }"
              >
                <template #option="slotProps">
                  <div class="flex align-items-center justify-between">
                    <div class="mr-2">{{ slotProps.option.name }}</div>
                  </div>
                </template>
              </Listbox>
            </div>
          </div>
        </div>

        <!-- Solutions -->
        <div class="flex flex-col p-3 md:px-8 md:pl-0 md:p-8 gap-6 w-full">
          <!-- Loading -->
          <template v-if="loading">
            <LoadingList />
          </template>
          <!-- Default View -->
          <template v-else-if="selectedCategory?.code === 'all'">
            <div class="md:text-base lg:text-2xl font-medium">Featured</div>
            <ListSolutions :solutions="featured" />
            <div class="text-base font-medium">New releases</div>
            <ListSolutions :solutions="released" />
          </template>
          <!-- Searched -->
          <template v-else-if="searchForQuery">
            <template v-if="solutions.length > 0">
              <div class="text-sm">
                {{ solutions.length }} search results for
                <span class="font-medium">“{{ search }}”</span>
              </div>
              <ListSolutions :solutions="solutions" />
            </template>
            <template v-else>
              <div class="text-sm">
                <span>No results found.</span>
                <PrimeButton
                  label="Go to full integrations list."
                  link
                  class="ml-3 p-0"
                  size="small"
                  @click="resetFilters"
                />
              </div>
              <LoadingEmptySearch />
            </template>
          </template>
          <!-- Category -->
          <template v-else>
            <div class="md:text-base lg:text-2xl font-medium">
              {{ selectedCategory.name }}
            </div>
            <ListSolutions :solutions="solutions" />
          </template>
        </div>
      </div>
    </template>
  </BannerContentBlock>
</template>

<script setup>
  import { computed, ref, watch, onMounted } from 'vue'
  import BannerContentBlock from '@/templates/content-block/banner'
  import InputText from '@aziontech/webkit/inputtext'
  import Listbox from '@aziontech/webkit/listbox'
  import PrimeButton from '@aziontech/webkit/button'
  import ListSolutions from './components/ListSolutions'
  import LoadingList from './components/LoadingList'
  import LoadingEmptySearch from './components/LoadingEmptySearch'
  import { useToast } from '@aziontech/webkit/use-toast'
  import { marketplaceService } from '@/services/v2/marketplace'
  import { useDebounceFn } from '@vueuse/core'

  defineOptions({ name: 'marketplace-home' })

  const selectedCategory = ref({ name: 'All', code: 'all' })
  const search = ref('')
  const searchForQuery = ref('')
  const listData = ref([])
  const listLoading = ref(false)
  const listError = ref(null)
  const categoriesData = ref([])
  const categoriesLoading = ref(false)

  const $toast = useToast()

  const PAGE_TYPE = 'marketplace'
  const ERROR_PROPS = { closable: true, severity: 'error' }
  const CATEGORY_ALL = { name: 'All', code: 'all' }
  const SEARCH_DEBOUNCE_MS = 500
  const PREFETCH_TAB_NAMES = ['Security', 'Performance', 'Edge AI']

  const loading = computed(() => listLoading.value || categoriesLoading.value)

  const solutions = computed(() => {
    const list = listData.value || []
    if (searchForQuery.value) {
      return list.filter((solution) => !solution.instanceType?.isTemplate)
    }
    return list
  })

  const featured = computed(() => solutions.value.filter((solution) => solution.featured))

  const released = computed(() => solutions.value.filter((solution) => solution.released))

  const categoriesList = computed(() => {
    const data = categoriesData.value || []
    const mapped = data
      .map((category) => ({
        name: category.name,
        code: category.slug,
        total: category.solutionsCount
      }))
      .filter((category) => category.total > 0 && category.code !== 'build')
    return mapped.length ? [CATEGORY_ALL, ...mapped] : []
  })

  const getListParams = () => {
    if (searchForQuery.value) {
      return { type: PAGE_TYPE, search: searchForQuery.value }
    }
    const code = selectedCategory.value?.code ?? 'all'
    return { type: PAGE_TYPE, category: code }
  }

  const isCanceledError = (err) => err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED'

  const disabledOption = ({ code }) => code === selectedCategory.value?.code

  const changeCategory = () => {
    const { code } = selectedCategory.value
    if (code === 'all') {
      searchForQuery.value = ''
      search.value = ''
    }
  }

  const runSearch = () => {
    const term = search.value.trim()
    if (term === '') {
      resetFilters()
      return
    }
    selectedCategory.value = { code: '', name: '' }
    searchForQuery.value = term
  }

  const searchSolutions = useDebounceFn(runSearch, SEARCH_DEBOUNCE_MS)

  const resetFilters = () => {
    selectedCategory.value = CATEGORY_ALL
    search.value = ''
    searchForQuery.value = ''
  }

  let listRequestId = 0
  let listAbortController = null

  watch(
    () => getListParams(),
    async () => {
      listAbortController?.abort()
      listAbortController = new AbortController()
      const signal = listAbortController.signal

      const id = ++listRequestId
      const params = getListParams()
      listLoading.value = true
      listError.value = null
      try {
        const data = await marketplaceService.fetchListWithCache(params, { signal })
        if (id === listRequestId) listData.value = data ?? []
      } catch (err) {
        if (id === listRequestId && !isCanceledError(err)) {
          listError.value = err
          $toast.add({
            ...ERROR_PROPS,
            summary: err?.message ?? err
          })
        }
      } finally {
        if (id === listRequestId) listLoading.value = false
      }
    },
    { immediate: true }
  )

  onMounted(async () => {
    categoriesLoading.value = true
    try {
      const data = await marketplaceService.fetchCategoriesWithCache()
      const list = Array.isArray(data) ? data : []
      categoriesData.value = list
      const slugsToPrefetch = list
        .filter((cat) => PREFETCH_TAB_NAMES.includes(cat.name))
        .map((cat) => cat.slug)
        .filter(Boolean)
      if (slugsToPrefetch.length > 0) {
        marketplaceService.prefetchListByCategories(slugsToPrefetch)
      }
    } catch (err) {
      if (!isCanceledError(err)) {
        $toast.add({ ...ERROR_PROPS, summary: err?.message ?? err })
      }
    } finally {
      categoriesLoading.value = false
    }
  })
</script>
