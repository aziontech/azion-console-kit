<template>
  <div class="flex flex-col w-full min-w-0 gap-2">
    <MultiSelect
      v-model="selectedValue"
      :options="items"
      :optionLabel="payload.label"
      :virtualScrollerOptions="virtualScrollerConfig"
      :loading="loading"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxSelectedLabels="2"
      :selectedItemsLabel="`{0} items selected`"
      class="rte-multiselect-lazy w-full min-w-0"
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
  import { ref, onMounted, watch } from 'vue'
  import { watchDebounced } from '@vueuse/core'
  import { listWorkloadsDynamicFieldsService } from '@/services/workloads-services'
  import * as yup from 'yup'
  import { useField } from 'vee-validate'
  import MultiSelect from '@aziontech/webkit/multiselect'
  import PrimeButton from '@aziontech/webkit/button'
  import InputText from '@aziontech/webkit/inputtext'

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

  const emit = defineEmits(['update:value'])

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

  const { value: selectedValue, errorMessage } = useField('selectedValue', yup.array().min(1), {
    initialValue: props.value
  })

  watch(selectedValue, (newValue) => emit('update:value', newValue))

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

      const response = await listWorkloadsDynamicFieldsService({
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

<style>
  /* Trigger: prevent chips from forcing the row to grow. The label container
     gets a max-height so the trigger stays single-row-tall; overflow scrolls
     vertically when chips exceed the visible area (rare, since
     maxSelectedLabels=2 collapses to "{N} items selected" first). */
  .rte-multiselect-lazy .p-multiselect-label {
    max-height: 2rem;
    overflow-y: auto;
    flex-wrap: wrap;
  }

  /* Teleported panel: PrimeVue sizes it to the trigger width by default.
     With multiple chips that becomes huge and spills outside the modal.
     Cap the panel so it never exceeds the viewport (minus 1rem on each side). */
  .p-multiselect-panel {
    max-width: calc(100vw - 2rem);
  }
</style>
