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
            Take advantage of templates, libraries, and integrations to build and compose edge
            applications.
          </div>
        </div>
      </div>
    </template>
    <template #content>
      <div class="w-full flex flex-col md:flex-row gap-6 lg:gap-8">
        <!-- Sidebar -->
        <div
          class="flex flex-col md:flex-shrink-0 gap-8 px-3 pt-8 pb-0 sm:px-8 w-full md:pr-0 md:w-80 md:sticky md:top-14 self-start"
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
            <label class="text-color text-base font-medium">Filters</label>
            <div class="card flex justify-content-center">
              <Listbox
                v-model="selectedCategory"
                :options="categoriesList"
                @change="changeCategory"
                option-label="name"
                class="w-full md:w-14rem border-none sm:min-w-[12rem]"
                :pt="{
                  list: { class: 'p-0' }
                }"
              >
                <template #header>
                  <div class="text-xs mt-2 ml-3 mb-3">Category</div>
                </template>
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
        <div class="flex flex-col p-3 md:pl-0 sm:p-8 gap-6 w-full">
          <!-- Loading -->
          <template v-if="loading">
            <LoadingList />
          </template>
          <!-- Default View -->
          <template v-else-if="allSelected">
            <div class="md:text-base lg:text-2xl font-medium">Featured</div>
            <ListSolutions :solutions="featured" />
            <div class="text-base font-medium">New releases</div>
            <ListSolutions :solutions="released" />
          </template>
          <!-- Searched -->
          <template v-else-if="searching">
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
  import { computed, onBeforeMount, ref } from 'vue'
  import BannerContentBlock from '@/templates/content-block/banner'
  import InputText from 'primevue/inputtext'
  import Listbox from 'primevue/listbox'
  import PrimeButton from 'primevue/button'
  import ListSolutions from './components/ListSolutions'
  import LoadingList from './components/LoadingList'
  import LoadingEmptySearch from './components/LoadingEmptySearch'
  import { useToast } from 'primevue/usetoast'

  const selectedCategory = ref({ name: 'All', code: 'all' })
  const categories = ref([])
  const $toast = useToast()
  const loading = ref(false)
  const solutions = ref([])
  const searching = ref(false)
  const search = ref('')
  const PAGE_TYPE = 'marketplace'
  const ERROR_PROPS = {
    closable: true,
    severity: 'error'
  }
  const CATEGORY_ALL = { name: 'All', code: 'all' }

  defineOptions({ name: 'marketplace-home' })

  const props = defineProps({
    listCategoriesService: {
      type: Function,
      required: true
    },
    listSolutionsService: {
      type: Function,
      required: true
    }
  })

  onBeforeMount(() => {
    loadData()
  })

  const loadData = async () => {
    try {
      loading.value = true
      const payload = { type: PAGE_TYPE }
      const promises = [props.listCategoriesService(payload), loadSolutions(payload)]

      const [categoriesData, templatesData] = await Promise.all(promises)
      categories.value = categoriesData
      solutions.value = templatesData
    } catch (error) {
      $toast.add({ ...ERROR_PROPS, summary: error })
    } finally {
      loading.value = false
    }
  }

  const loadSolutions = (payload) => {
    return props.listSolutionsService(payload)
  }

  const changeCategory = async () => {
    const code = selectedCategory.value.code
    const category = code === 'all' ? undefined : code

    try {
      loading.value = true
      search.value = ''
      searching.value = false
      solutions.value = await loadSolutions({
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

  const searchSolutions = debounce(async () => {
    if (search.value === '') {
      resetFilters()
      return
    }

    try {
      selectedCategory.value = {}
      searching.value = !!search.value
      loading.value = true
      const payload = { type: PAGE_TYPE, search: search.value }
      const loadedSolutions = await loadSolutions(payload)
      solutions.value = loadedSolutions.filter((solution) => !solution.instanceType.isTemplate)
    } catch (error) {
      $toast.add({ ...ERROR_PROPS, summary: error })
    } finally {
      loading.value = false
    }
  })

  const resetFilters = async () => {
    try {
      loading.value = true
      selectedCategory.value = CATEGORY_ALL
      searching.value = false
      search.value = ''

      const payload = { type: PAGE_TYPE }
      solutions.value = await loadSolutions(payload)
    } catch (error) {
      $toast.add({ ...ERROR_PROPS, summary: error })
    } finally {
      loading.value = false
    }
  }

  const featured = computed(() => {
    return solutions.value.filter((solution) => solution.featured)
  })

  const released = computed(() => {
    return solutions.value.filter((solution) => solution.released)
  })

  const allSelected = computed(() => {
    return selectedCategory.value.code === 'all'
  })

  const categoriesList = computed(() => {
    let mappedCategories = categories.value.map((category) => ({
      name: category.name,
      code: category.slug,
      total: category.solutionsCount
    }))
    mappedCategories = mappedCategories.filter(
      (category) => category.total > 0 && category.code !== 'build'
    )

    return mappedCategories.length ? [CATEGORY_ALL, ...mappedCategories] : []
  })
</script>
