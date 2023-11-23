<template>
  <div class="flex flex-col">
    <div class="px-3 py-4 sm:px-8 sm:py-8 lg:pb-16 flex flex-col gap-4 border-b surface-border">
      <div class="text-2xl sm:text-3xl font-medium">
        The place to find, deploy, and manage third-party solutions
      </div>
      <div class="text-sm sm:text-xl text-color-secondary">
        Marketplace lets you quickly deploy software on Azion Edge Platform.
      </div>
    </div>

    <div class="flex flex-col md:flex-row gap-6 lg:gap-8 mb-8">
      <!-- Sidebar -->
      <div
        class="flex flex-col md:flex-shrink-0 gap-8 px-3 pt-8 pb-0 sm:px-8 w-full md:w-80 md:sticky md:top-10 self-start"
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
              placeholder="Search on Marketplace"
              @input="searchSolutions"
              v-model="search"
            />
          </span>
        </div>
        <!-- Filters -->
        <div class="flex flex-col gap-3">
          <label class="text-color text-base font-medium">Filters</label>
          <div class="card flex justify-content-center">
            <Listbox
              v-model="selectedCategory"
              :options="categoriesList"
              @change="changeCategory"
              option-label="name"
              class="w-full md:w-14rem border-none sm:min-w-[12rem]"
              :pt="{
                item: { class: 'text-sm py-2 px-3' },
                list: { class: 'p-0' }
              }"
            >
              <template #header>
                <div class="text-xs mt-2 ml-3 mb-3">Category</div>
              </template>
              <template #option="slotProps">
                <div class="flex align-items-center justify-between">
                  <div>{{ slotProps.option.name }}</div>
                  <Badge
                    v-if="slotProps.option.code !== 'all'"
                    :value="slotProps.option.total"
                  />
                </div>
              </template>
            </Listbox>
          </div>
        </div>
      </div>

      <!-- Templates -->
      <div class="flex flex-col p-3 sm:p-8 gap-6 w-full">
        <!-- Loading -->
        <template v-if="loading">
          <LoadingListTemplate />
        </template>
        <!-- Default View -->
        <template v-else-if="selectedCategory.code === 'all' && !searching">
          <div class="text-2xl font-medium">Featured</div>
          <ListTemplates :templates="featured" />
          <div class="text-base font-medium">New releases</div>
          <ListTemplates :templates="released" />
        </template>
        <!-- Searched -->
        <template v-else-if="searching">
          <template v-if="templates.length > 0">
            <div class="text-sm">
              {{ templates.length }} search results for
              <span class="font-medium">“{{ search }}”</span>
            </div>
            <ListTemplates :templates="templates" />
          </template>
          <template v-else>
            <div class="text-sm">
              <span>No results found</span>
              <PrimeButton
                label="See full integrations list."
                link
                class="ml-3 p-0"
                size="small"
              />
            </div>
            <LoadingEmptySearch />
          </template>
        </template>
        <!-- Category -->
        <template v-else>
          <div class="text-2xl font-medium">
            {{ selectedCategory.name }}
          </div>
          <ListTemplates :templates="templates" />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed, onBeforeMount, ref } from 'vue'
  import InputText from 'primevue/inputtext'
  import Listbox from 'primevue/listbox'
  import Badge from 'primevue/badge'
  import PrimeButton from 'primevue/button'
  import * as MarketplaceService from '@/services/marketplace-services'
  import ListTemplates from './ListTemplates.vue'
  import LoadingListTemplate from './LoadingListTemplate'
  import LoadingEmptySearch from './LoadingEmptySearch'
  import { useToast } from 'primevue/usetoast'

  const selectedCategory = ref({ name: 'All', code: 'all' })
  const categories = ref([])
  const $toast = useToast()
  const loading = ref(false)
  const templates = ref([])
  const searching = ref(false)
  const search = ref('')
  const PAGE_TYPE = 'marketplace'
  const ERROR_PROPS = {
    closable: true,
    severity: 'error',
    life: 10000
  }
  const CATEGORY_ALL = { name: 'All', code: 'all' }

  onBeforeMount(() => {
    loadData()
  })

  const loadData = async () => {
    try {
      loading.value = true
      const payload = { type: PAGE_TYPE }
      const promises = [MarketplaceService.listCategoriesService(payload), loadSolutions(payload)]

      const [categoriesData, templatesData] = await Promise.all(promises)
      categories.value = categoriesData
      templates.value = templatesData
    } catch (error) {
      $toast.add({ ...ERROR_PROPS, summary: error })
    } finally {
      loading.value = false
    }
  }

  const loadSolutions = (payload) => {
    return MarketplaceService.listSolutionsService(payload)
  }

  const changeCategory = async () => {
    const code = selectedCategory.value.code
    const category = code === 'all' ? undefined : code

    try {
      loading.value = true
      search.value = ''
      searching.value = false
      templates.value = await loadSolutions({
        type: PAGE_TYPE,
        category
      })
    } catch (error) {
      $toast.add({ ...ERROR_PROPS, summary: error })
    } finally {
      loading.value = false
    }
  }

  const debounce = (func, timeout = 400) => {
    let timer
    return (...args) => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        func.apply(this, args)
      }, timeout)
    }
  }

  const searchSolutions = debounce(async (event) => {
    try {
      selectedCategory.value = CATEGORY_ALL
      searching.value = !!event.target.value
      loading.value = true
      const payload = { type: PAGE_TYPE, search: event.target.value }
      templates.value = await loadSolutions(payload)
    } catch (error) {
      $toast.add({ ...ERROR_PROPS, summary: error })
    } finally {
      loading.value = false
    }
  })

  const featured = computed(() => {
    return templates.value.filter((i) => i.featured)
  })

  const released = computed(() => {
    return templates.value.filter((i) => i.released)
  })

  const categoriesList = computed(() => {
    const mapped = categories.value.map((i) => ({
      name: i.name,
      code: i.slug,
      total: i.solutions_count
    }))

    return mapped.length ? [CATEGORY_ALL, ...mapped] : []
  })
</script>
