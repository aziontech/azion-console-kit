<template>
  <div class="flex flex-col w-full sm:w-full gap-2">
    <label
      for="in_field"
      class="text-sm font-medium leading-5 text-color"
    >
      Field *
    </label>
    <MultiSelect
      v-model="selectedValue"
      :options="items"
      :optionLabel="payload.label"
      :virtualScrollerOptions="virtualScrollerConfig"
      :loading="loading"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full md:w-14rem"
      display="chip"
    >
      <template #header>
        <div class="flex">
          <InputText
            placeholder="Search"
            v-model="search"
            :pt="{ root: { class: 'rounded-none w-full' } }"
          />
          <PrimeButton
            icon="pi pi-search"
            @click="loadDomains()"
            :pt="{ root: { class: 'rounded-none cursor-pointer' } }"
          />
        </div>
      </template>
    </MultiSelect>
    <small
      v-if="errorMessage"
      class="p-error text-xs font-normal leading-tight"
      >{{ errorMessage }}</small
    >
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { watchDebounced } from '@vueuse/core'
  import { listWorkloadsService } from '@/services/workloads-services/list-workloads-service'
  import * as yup from 'yup'
  import { useField } from 'vee-validate'
  import MultiSelect from 'primevue/multiselect'
  import PrimeButton from 'primevue/button'
  import InputText from 'primevue/inputtext'

  defineOptions({ name: 'multiSelectLazyLoaderFilter' })

  const props = defineProps({
    value: {
      type: Array
    },
    options: {
      type: Object
    },
    placeholder: {
      type: String,
      default: 'Select'
    },
    payload: {
      type: Object,
      default: () => {
        return {
          label: 'label',
          value: 'value'
        }
      }
    },
    disabled: {
      type: Boolean
    }
  })

  const PAGE_INCREMENT = 1
  const PAGE_SIZE = 100
  const INITIAL_PAGE = 1
  const SEARCH_DEBOUNCE = 500
  const SEARCH_MAX_WAIT = 1000

  const items = ref([])
  const loading = ref(false)
  const page = ref(INITIAL_PAGE)
  const totalCount = ref(0)
  const search = ref('')

  const { value: selectedValue, errorMessage } = useField(
    'selectedValue',
    yup.array().min(1).required(),
    {
      initialValue: props.value
    }
  )

  onMounted(async () => {
    await loadDomains()
  })

  const handleLazyLoad = (event) => {
    const { last } = event
    const pageSizeCount = PAGE_SIZE * page.value

    if (last >= pageSizeCount) {
      page.value += PAGE_INCREMENT
      loadDomains()
    }
  }

  const loadDomains = async () => {
    try {
      loading.value = true
      if (page.value === INITIAL_PAGE) {
        items.value = []
      }

      const response = await listWorkloadsService({
        pageSize: PAGE_SIZE,
        page: page.value,
        fields: 'id,name',
        search: search.value
      })

      totalCount.value = response.count
      let results = response.results.map((el) => {
        return { label: el.name, value: el.id }
      })

      checkItemsDuplicatedList()

      if (page.value === INITIAL_PAGE) {
        items.value = results
      } else {
        items.value = [...items.value, ...results]
      }

      setSelectedItemsToArray()
    } finally {
      loading.value = false
    }
  }

  const setSelectedItemsToArray = () => {
    if (Array.isArray(selectedValue.value) && Array.isArray(items.value)) {
      selectedValue.value.forEach((selectedElement) => {
        const existId = items.value.find((item) => item.value === selectedElement.value)
        if (existId) return

        items.value.push(selectedElement)
      })
    }
  }

  const checkItemsDuplicatedList = () => {
    if (Array.isArray(selectedValue.value)) {
      items.value = items.value.filter(
        (result) => !selectedValue.value.some((selected) => selected.value === result.value)
      )
    }
  }

  const virtualScrollerConfig = {
    lazy: true,
    onLazyLoad: handleLazyLoad,
    itemSize: 38,
    showLoader: true,
    loading
  }

  watchDebounced(
    search,
    () => {
      page.value = INITIAL_PAGE
      loadDomains()
    },
    { debounce: SEARCH_DEBOUNCE, maxWait: SEARCH_MAX_WAIT }
  )
</script>
