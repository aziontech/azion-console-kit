<template>
  <div class="flex flex-col w-full sm:w-full gap-2">
    <LabelBlock
      v-if="props.label"
      :for="props.name"
      :label="props.label"
      :isRequired="$attrs.required"
      :data-testid="customTestId.label"
    />
    <MultiSelect
      :id="props.name"
      v-model="selectedValue"
      :options="items"
      :optionLabel="optionLabel"
      :optionValue="optionValue"
      :virtualScrollerOptions="virtualScrollerConfig"
      :loading="loading"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full sm:max-w-xs overflow-hidden"
      @change="emitChange"
      @blur="emitBlur"
      display="chip"
      :pt="{
        filterInput: {
          class: 'max-w-full',
          'data-testid': customTestId.filterInput
        },
        trigger: {
          'data-testid': customTestId.trigger
        },
        loadingIcon: {
          'data-testid': customTestId.loadingIcon
        }
      }"
      :data-testid="customTestId.dropdown"
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
            @click="fetchListData()"
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
  import { toRef, computed, useAttrs, ref, onMounted } from 'vue'
  import { watchDebounced } from '@vueuse/core'
  import * as yup from 'yup'
  import { useField } from 'vee-validate'
  import MultiSelect from 'primevue/multiselect'
  import PrimeButton from 'primevue/button'
  import InputText from 'primevue/inputtext'
  import LabelBlock from '@/templates/label-block'

  const emit = defineEmits(['onBlur', 'onChange'])

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
    },
    loadService: {
      type: Function
    },
    service: {
      type: Function
    },
    fields: {
      type: Array,
      default: () => {
        return ['id,name']
      }
    },
    ordering: {
      type: String,
      default: () => {
        return 'name'
      }
    },
    optionLabel: {
      type: String,
      default: () => {
        return 'name'
      }
    },
    optionValue: {
      type: String,
      default: () => {
        return 'id'
      }
    },
    label: {
      type: String
    },
    name: {
      type: String,
      required: true
    }
  })

  const PAGE_INCREMENT = 1
  const PAGE_SIZE = 100
  const INITIAL_PAGE = 1
  const SEARCH_DEBOUNCE = 500
  const SEARCH_MAX_WAIT = 1000

  const name = toRef(props, 'name')
  const items = ref([])
  const loading = ref(false)
  const page = ref(INITIAL_PAGE)
  const totalCount = ref(0)
  const search = ref('')

  const { value: selectedValue, errorMessage } = useField(name, yup.array(), {
    initialValue: props.value
  })

  const attrs = useAttrs()

  const customTestId = computed(() => {
    const id = attrs['data-testid'] || 'field-dropdown'

    return {
      label: `${id}__label`,
      dropdown: `${id}__dropdown`,
      value: `${id}__value`,
      description: `${id}__description`,
      error: `${id}__error-message`,
      filterInput: `${id}__dropdown-filter-input`,
      trigger: `${id}__dropdown-trigger`,
      loadingIcon: `${id}__loading-icon`,
      search: `${id}__dropdown-search`
    }
  })

  onMounted(async () => {
    await fetchListData()
  })

  const emitBlur = () => {
    emit('onBlur')
  }

  const emitChange = () => {
    emit('onChange', selectedValue.value)
  }

  const handleLazyLoad = (event) => {
    const { last } = event
    const pageSizeCount = PAGE_SIZE * page.value

    if (last >= pageSizeCount) {
      page.value += PAGE_INCREMENT
      fetchListData()
    }
  }

  const fetchListData = async () => {
    try {
      loading.value = true

      const response = await props.service({
        pageSize: PAGE_SIZE,
        page: page.value,
        search: search.value,
        ordering: props.ordering,
        fields: props.fields
      })

      totalCount.value = response.count

      let results = response.body?.map((item) => {
        return {
          [props.optionLabel]: item.name,
          [props.optionValue]: item.id,
          ...props?.moreOptions?.reduce(
            (additionalFields, option) => ({
              ...additionalFields,
              [option]: item[option]
            }),
            {}
          )
        }
      })

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
      fetchListData()
    },
    { debounce: SEARCH_DEBOUNCE, maxWait: SEARCH_MAX_WAIT }
  )
</script>
