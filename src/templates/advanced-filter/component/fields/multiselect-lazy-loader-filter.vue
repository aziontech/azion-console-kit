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

  const PAGE_SIZE_INCREMENT = 100
  const INITIAL_PAGE_SIZE = 100
  const SEARCH_DEBOUNCE = 500
  const SEARCH_MAX_WAIT = 1000

  const items = ref([])
  const loading = ref(false)
  const pageSize = ref(INITIAL_PAGE_SIZE)
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
    if (last >= pageSize.value) {
      pageSize.value += PAGE_SIZE_INCREMENT
      loadDomains()
    }
  }

  const loadDomains = async () => {
    try {
      loading.value = true
      const response = await listWorkloadsService({
        pageSize: pageSize.value,
        page: 1,
        fields: 'id,name',
        search: search.value
      })
      items.value = response.results.map((el) => {
        return { label: el.name, value: el.id }
      })
    } finally {
      loading.value = false
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
      pageSize.value = INITIAL_PAGE_SIZE
      loadDomains()
    },
    { debounce: SEARCH_DEBOUNCE, maxWait: SEARCH_MAX_WAIT }
  )
</script>
